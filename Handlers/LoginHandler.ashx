<%@ WebHandler Language="C#" Class="LoginHandler" %>
using System;
using System.Web;
using System.Text;
using System.Data;
using System.Data.SqlClient;
using System.Configuration;

public class LoginHandler : IHttpHandler {
    private string cn = ConfigurationManager.ConnectionStrings["cn"].ConnectionString;

    public void ProcessRequest (HttpContext context) {
        context.Response.ContentType = "application/json";
        context.Response.AddHeader("Access-Control-Allow-Origin", "*");
        
        try {
            // BUG RESOLVIDO: O ASP.NET concatena valores se o parâmetro vier na QueryString e no Form (ex: "true,true")
            // Usamos .Contains("true") para garantir a detecção correta
            string cp = (context.Request.Params["checkonly"] ?? context.Request.Params["checkOnly"] ?? "").ToLower();
            bool isCheckOnly = cp.Contains("true");
            
            string documento = context.Request.Params["cpf"] ?? "";
            string senha = context.Request.Params["senha"] ?? "";

            // Limpeza de Documento (CPF/CNPJ)
            string docLimpo = System.Text.RegularExpressions.Regex.Replace(documento, @"[^\d]", "");

            if (string.IsNullOrEmpty(docLimpo)) {
                context.Response.Write("{\"status\": \"error\", \"message\": \"CPF ou CNPJ obrigatório\"}");
                return;
            }

            // Validação de Senha (pula se for biometria/checkOnly)
            if (!isCheckOnly && string.IsNullOrEmpty(senha)) {
                context.Response.Write("{\"status\": \"error\", \"message\": \"Senha obrigatória para este login\"}");
                return;
            }

            using (SqlConnection conn = new SqlConnection(cn)) {
                conn.Open();

                // Busca Pessoas (Biometria / Funcionários)
                string sqlPessoa = @"
                    SELECT PessoaID, Nome, ContraSenha, EmpresaId, RE 
                    FROM dbo.Pessoas 
                    WHERE REPLACE(REPLACE(REPLACE(REPLACE(Documento, '.', ''), '-', ''), '/', ''), ' ', '') = @doc 
                    AND RegStatus = 'A'";
                
                SqlCommand cmdPessoa = new SqlCommand(sqlPessoa, conn);
                cmdPessoa.Parameters.AddWithValue("@doc", docLimpo);
                
                using (SqlDataReader drP = cmdPessoa.ExecuteReader()) {
                    if (drP.Read()) {
                        if (isCheckOnly) {
                            context.Response.Write("{\"status\": \"ok\", \"message\": \"Usuário autorizado\"}");
                            return;
                        }

                        string dbSenha = drP["ContraSenha"].ToString();
                        if (senha == dbSenha || (string.IsNullOrEmpty(dbSenha) && senha == docLimpo)) {
                            context.Response.Write(string.Format(
                                "{{\"status\": \"ok\", \"usuarioId\": \"P{0}\", \"nome\": \"{1}\", \"re\": \"{2}\", \"pessoaId\": {0}, \"empresaId\": {3}, \"tipo\": \"pessoa\"}}",
                                drP["PessoaID"], drP["Nome"], drP["RE"], drP["EmpresaId"]
                            ));
                            return;
                        } else {
                            context.Response.Write("{\"status\": \"error\", \"message\": \"Senha incorreta\"}");
                            return;
                        }
                    }
                }

                // Fallback: Usuarios
                string sql = @"
                    SELECT u.UsuarioId, u.UsuarioNome, u.UsuarioSenha, u.PessoaID, u.EmpresaId, p.RE 
                    FROM dbo.Usuarios u
                    LEFT JOIN dbo.Pessoas p ON u.PessoaID = p.PessoaID
                    WHERE REPLACE(REPLACE(REPLACE(REPLACE(u.UsuarioDocumento, '.', ''), '-', ''), '/', ''), ' ', '') = @doc 
                    AND u.RegStatus = 'A'";
                
                SqlCommand cmd = new SqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("@doc", docLimpo);
                
                using (SqlDataReader dr = cmd.ExecuteReader()) {
                    if (dr.Read()) {
                        if (isCheckOnly) {
                            context.Response.Write("{\"status\": \"ok\", \"message\": \"Usuário autorizado\"}");
                            return;
                        }

                        string dbSenha = dr["UsuarioSenha"].ToString();
                        if (senha == dbSenha || senha == docLimpo) {
                            context.Response.Write(string.Format(
                                "{{\"status\": \"ok\", \"usuarioId\": {0}, \"nome\": \"{1}\", \"re\": \"{2}\", \"pessoaId\": {3}, \"empresaId\": {4}, \"tipo\": \"usuario\"}}",
                                dr["UsuarioId"], dr["UsuarioNome"], dr["RE"], dr["PessoaID"], dr["EmpresaId"]
                            ));
                        } else {
                            context.Response.Write("{\"status\": \"error\", \"message\": \"Senha incorreta\"}");
                        }
                        return;
                    }
                }

                context.Response.Write("{\"status\": \"error\", \"message\": \"Usuário não localizado\"}");
            }
        } catch (Exception ex) {
            context.Response.Write("{\"status\": \"error\", \"message\": \"Falha técnica: " + ex.Message.Replace("\"", "'") + "\"}");
        }
    }

    public bool IsReusable { get { return false; } }
}
