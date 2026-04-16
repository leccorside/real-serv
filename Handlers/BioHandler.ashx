<%@ WebHandler Language="C#" Class="BioHandler" %>
using System;
using System.Web;
using System.Text;
using System.Data;
using System.Data.SqlClient;
using System.Configuration;
using System.IO;
using System.Collections.Generic;

public class BioHandler : IHttpHandler {
    string cn = ConfigurationManager.ConnectionStrings["cn"].ConnectionString;

    public void ProcessRequest(HttpContext context) {
        context.Response.ContentType = "application/json";
        context.Response.AddHeader("Access-Control-Allow-Origin", "*");

        try {
            if (context.Request.HttpMethod != "POST") {
                context.Response.Write("{\"status\": \"error\", \"message\": \"Metodo nao suportado\"}");
                return;
            }

            // O App envia via multipart/form-data ou via Params dependendo da versao
            string cpf = context.Request.Form["cpf"] ?? context.Request.Params["cpf"] ?? "";
            string pessoaIdStr = context.Request.Form["pessoaId"] ?? context.Request.Params["pessoaId"] ?? "0";
            int pessoaId = int.Parse(pessoaIdStr);

            string empresaIdStr = context.Request.Form["empresaId"] ?? context.Request.Params["empresaId"] ?? "0";
            int empresaId = int.Parse(empresaIdStr);

            if (string.IsNullOrEmpty(cpf) && pessoaId == 0) {
                context.Response.Write("{\"status\": \"error\", \"message\": \"CPF ou Identificador obrigatorio\"}");
                return;
            }

            // 1. Verificar se ha arquivos enviados (Fluxo de Cadastro - 6 fotos)
            if (context.Request.Files.Count > 0) {
                HandleEnrollment(context, cpf, pessoaId, empresaId);
            } else {
                // 2. Fluxo de Verificacao Simples ou Erro
                string selfieB64 = context.Request.Form["foto"] ?? context.Request.Params["foto"];
                if (!string.IsNullOrEmpty(selfieB64)) {
                   // Se chegar aqui, redireciona internamente ou avisa para usar o FaceAuthHandler
                   context.Response.Write("{\"status\": \"error\", \"message\": \"Este handler e para cadastro. Use o FaceAuthHandler para autenticacao.\"}");
                } else {
                   context.Response.Write("{\"status\": \"error\", \"message\": \"Nenhuma foto recebida para o cadastro.\"}");
                }
            }

        } catch (Exception ex) {
            context.Response.Write("{\"status\": \"error\", \"message\": \"Erro: " + ex.Message.Replace("\"", "'") + "\"}");
        }
    }

    private void HandleEnrollment(HttpContext context, string cpf, int pessoaId, int empresaId) {
        string uploadDir = context.Server.MapPath("~/Content/Uploads/Pessoas_Fotos/");
        if (!Directory.Exists(uploadDir)) Directory.CreateDirectory(uploadDir);

        if (pessoaId == 0) {
            // Se nao veio ID, busca pelo CPF
            pessoaId = GetPessoaIdByCpf(cpf);
            if (pessoaId == 0) throw new Exception("Colaborador nao localizado para o CPF informado.");
        }

        long timestamp = DateTime.Now.Ticks;
        string mainPhotoPath = "";
        List<string> savedPaths = new List<string>();

        // Percorre todos os arquivos enviados (foto0, foto1, etc)
        for (int i = 0; i < context.Request.Files.Count; i++) {
            HttpPostedFile file = context.Request.Files[i];
            if (file.ContentLength > 0) {
                // Nome padrao: pessoa_ID_bio_INDEX_TIMESTAMP.jpg
                string fileName = string.Format("pessoa_{0}_bio_{1}_{2}.jpg", pessoaId, i, timestamp);
                string fullPath = Path.Combine(uploadDir, fileName);
                file.SaveAs(fullPath);
                
                string relativePath = "~/Content/Uploads/Pessoas_Fotos/" + fileName;
                savedPaths.Add(relativePath);
                
                if (i == 0) {
                    mainPhotoPath = relativePath;
                    // O Sistema Web exige uma cópia 'thumb.jpg' da foto principal para exibir no perfil de edição
                    try {
                        string thumbName = fileName.Replace(".jpg", "thumb.jpg");
                        File.Copy(fullPath, Path.Combine(uploadDir, thumbName), true);
                    } catch { }
                }
            }
        }

        if (savedPaths.Count == 0) throw new Exception("Nenhuma foto valida foi processada.");

        // Atualiza o banco de dados
        using (SqlConnection conn = new SqlConnection(cn)) {
            conn.Open();
            
            // 1. Atualiza a foto principal na tabela Pessoas (Apenas FotoPessoa)
            SqlCommand cmdPessoa = new SqlCommand("UPDATE Pessoas SET FotoPessoa = @path WHERE PessoaID = @pid", conn);
            cmdPessoa.Parameters.AddWithValue("@path", mainPhotoPath);
            cmdPessoa.Parameters.AddWithValue("@pid", pessoaId);
            cmdPessoa.ExecuteNonQuery();

            // 2. Insere todas as fotos capturadas na tabela PessoasAnexos
            foreach (string path in savedPaths) {
                string fileName = Path.GetFileName(path);
                SqlCommand cmdAnexo = new SqlCommand(@"
                    IF NOT EXISTS (SELECT 1 FROM PessoasAnexos WHERE Path = @path AND PessoaID = @pid)
                    INSERT INTO PessoasAnexos (PessoaID, EmpresaID, Path, FileName, RegStatus, RegDtInicio, TipoAnexoID) 
                    VALUES (@pid, @eid, @path, @fname, 'A', GETDATE(), 1)", conn);
                
                cmdAnexo.Parameters.AddWithValue("@pid", pessoaId);
                cmdAnexo.Parameters.AddWithValue("@eid", empresaId);
                cmdAnexo.Parameters.AddWithValue("@path", path);
                cmdAnexo.Parameters.AddWithValue("@fname", fileName);
                cmdAnexo.ExecuteNonQuery();
            }
        }

        context.Response.Write("{\"status\": \"ok\", \"message\": \"Biometria cadastrada com sucesso! (" + savedPaths.Count + " fotos)\"}");
    }

    private int GetPessoaIdByCpf(string cpf) {
        string cleanCpf = System.Text.RegularExpressions.Regex.Replace(cpf, @"[^\d]", "");
        using (SqlConnection conn = new SqlConnection(cn)) {
            conn.Open();
            string sql = "SELECT PessoaID FROM Pessoas WHERE REPLACE(REPLACE(Documento, '.', ''), '-', '') = @cpf AND RegStatus = 'A'";
            SqlCommand cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@cpf", cleanCpf);
            object res = cmd.ExecuteScalar();
            return res != null ? Convert.ToInt32(res) : 0;
        }
    }

    public bool IsReusable { get { return false; } }
}
