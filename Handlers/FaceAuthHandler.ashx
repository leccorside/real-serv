<%@ WebHandler Language="C#" Class="FaceAuthHandler" %>
using System;
using System.Web;
using System.Net.Http;
using System.Text;
using System.Web.Script.Serialization;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Configuration;
using System.IO;
using System.Net;

public class FaceAuthHandler : IHttpHandler {
    private string cn = ConfigurationManager.ConnectionStrings["cn"].ConnectionString;
    private const string BIO_SERVICE_URL = "https://realserv.pythonanywhere.com/verify";

    public void ProcessRequest(HttpContext context) {
        context.Response.ContentType = "application/json";
        context.Response.AddHeader("Access-Control-Allow-Origin", "*");

        // Força TLS 1.2 para conexões com o PythonAnywhere
        ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;

        if (context.Request.HttpMethod != "POST") {
            context.Response.Write("{\"status\": \"error\", \"message\": \"Metodo nao suportado\"}");
            return;
        }

        try {
            string cpf = context.Request.Form["cpf"] ?? context.Request.Params["cpf"] ?? "";
            string selfieB64 = context.Request.Form["foto"] ?? context.Request.Params["foto"] ?? "";

            if (string.IsNullOrEmpty(cpf) || string.IsNullOrEmpty(selfieB64)) {
                context.Response.Write("{\"status\": \"error\", \"message\": \"Dados de captura incompletos.\"}");
                return;
            }

            string cleanId = System.Text.RegularExpressions.Regex.Replace(cpf, @"[^\d]", "");
            if (string.IsNullOrEmpty(cleanId)) cleanId = cpf.Trim();

            UserData user = GetUserData(cleanId);
            if (user == null) {
                context.Response.Write("{\"status\": \"error\", \"message\": \"Colaborador nao localizado ou sem foto principal.\"}");
                return;
            }

            // Tentar validar com a foto principal
            BioResult result = ValidateBio(context, selfieB64, user.FotoPessoa);
            
            // Se falhar na principal, tenta anexos adicionais em PessoasAnexos
            if (!result.match) {
                List<string> additionalPhotos = GetAdditionalPhotos(user.PessoaID, user.FotoPessoa);
                foreach (var photoPath in additionalPhotos) {
                    var nextResult = ValidateBio(context, selfieB64, photoPath);
                    if (nextResult.match) {
                        result = nextResult;
                        break;
                    }
                }
            }

            if (result.match) {
                context.Response.Write(string.Format(
                    "{{\"status\": \"ok\", \"usuarioId\": \"{0}\", \"nome\": \"{1}\", \"re\": \"{2}\", \"pessoaId\": {3}, \"empresaId\": {4}}}",
                    user.UsuarioId, user.Nome, user.RE, user.PessoaID, user.EmpresaID
                ));
            } else {
                string msg = result.message == "OK" ? "Biometria nao confere. Tente novamente em local iluminado." : result.message;
                context.Response.Write("{\"status\": \"error\", \"message\": \"" + msg + "\", \"similarity\": " + result.similarity.ToString().Replace(",", ".") + "}");
            }

        } catch (Exception ex) {
            context.Response.Write("{\"status\": \"error\", \"message\": \"Servidor: " + ex.Message.Replace("\"", "'") + "\"}");
        }
    }

    private UserData GetUserData(string cleanId) {
        using (SqlConnection conn = new SqlConnection(cn)) {
            conn.Open();
            string sql = @"
                SELECT TOP 1 p.PessoaID, p.Nome, p.RE, p.EmpresaID, u.UsuarioId, p.FotoPessoa
                FROM Pessoas p
                LEFT JOIN Usuarios u ON p.PessoaID = u.PessoaID
                WHERE (REPLACE(REPLACE(REPLACE(p.Documento, '.', ''), '-', ''), '/', '') = @id OR p.RE = @id)
                AND p.FotoPessoa IS NOT NULL AND p.RegStatus = 'A'";
            
            SqlCommand cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", cleanId);
            using (SqlDataReader dr = cmd.ExecuteReader()) {
                if (dr.Read()) {
                    return new UserData {
                        PessoaID = Convert.ToInt32(dr["PessoaID"]),
                        Nome = dr["Nome"].ToString(),
                        RE = dr["RE"].ToString(),
                        EmpresaID = Convert.ToInt32(dr["EmpresaID"]),
                        FotoPessoa = dr["FotoPessoa"].ToString(),
                        UsuarioId = dr["UsuarioId"] != DBNull.Value ? dr["UsuarioId"].ToString() : "P" + dr["PessoaID"].ToString()
                    };
                }
            }
        }
        return null;
    }

    private List<string> GetAdditionalPhotos(int pessoaId, string mainPath) {
        List<string> paths = new List<string>();
        using (SqlConnection conn = new SqlConnection(cn)) {
            conn.Open();
            string sql = "SELECT Path FROM PessoasAnexos WHERE PessoaID = @pid AND RegStatus = 'A' AND Path <> @main";
            SqlCommand cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@pid", pessoaId);
            cmd.Parameters.AddWithValue("@main", mainPath);
            using (SqlDataReader dr = cmd.ExecuteReader()) {
                while (dr.Read()) paths.Add(dr["Path"].ToString());
            }
        }
        return paths;
    }

    private BioResult ValidateBio(HttpContext context, string selfieB64, string profilePath) {
        try {
            string physicalPath = ResolvePath(context, profilePath);
            if (!File.Exists(physicalPath)) return new BioResult { match = false, message = "Foto de referencia ausente no disco." };

            string profileB64 = Convert.ToBase64String(File.ReadAllBytes(physicalPath));

            using (var client = new WebClient()) {
                client.Headers[HttpRequestHeader.ContentType] = "application/json";
                client.Encoding = Encoding.UTF8;
                
                var payload = new { img1_b64 = selfieB64, img2_b64 = profileB64 };
                var serializer = new JavaScriptSerializer();
                serializer.MaxJsonLength = 52428800; // 50MB
                string jsonInput = serializer.Serialize(payload);
                
                string jsonOutput = client.UploadString(BIO_SERVICE_URL, "POST", jsonInput);
                return serializer.Deserialize<BioResult>(jsonOutput);
            }
        } catch (Exception ex) {
            return new BioResult { match = false, message = "Microservico Python Indisponivel (" + ex.Message + ")" };
        }
    }

    private string ResolvePath(HttpContext context, string path) {
        string root = context.Server.MapPath("~").TrimEnd('\\', '/');
        string clean = path.Replace("~", "").Replace("/", "\\").TrimStart('\\');
        return Path.Combine(root, clean);
    }

    private class UserData {
        public int PessoaID;
        public string Nome;
        public string RE;
        public int EmpresaID;
        public string FotoPessoa;
        public string UsuarioId;
    }

    private class BioResult {
        public bool match { get; set; }
        public double similarity { get; set; }
        public string message { get; set; }
    }

    public bool IsReusable { get { return false; } }
}
