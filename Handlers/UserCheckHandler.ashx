<%@ WebHandler Language="C#" Class="UserCheckHandler" %>
using System;
using System.Web;
using System.Text.RegularExpressions;
using System.Data;
using System.Data.SqlClient;
using System.Configuration;

public class UserCheckHandler : IHttpHandler {
    private string cn = ConfigurationManager.ConnectionStrings["cn"].ConnectionString;

    public void ProcessRequest (HttpContext context) {
        context.Response.ContentType = "application/json";
        
        try {
            string cpf = context.Request.Form["cpf"] ?? "";
            cpf = Regex.Replace(cpf, @"[^\d]", "");

            if (string.IsNullOrEmpty(cpf)) {
                context.Response.Write("{\"status\": \"error\", \"message\": \"CPF obrigatório\"}");
                return;
            }

            using (SqlConnection conn = new SqlConnection(cn)) {
                conn.Open();
                
                // Busca na tabela Pessoas pela coluna Documento (Conforme solicitado pelo usuário)
                string sql = @"
                    SELECT COUNT(*) FROM dbo.Pessoas 
                    WHERE REPLACE(REPLACE(REPLACE(Documento, '.', ''), '-', ''), '/', '') = @cpf 
                    AND RegStatus = 'A'";
                
                SqlCommand cmd = new SqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("@cpf", cpf);
                int count = (int)cmd.ExecuteScalar();

                if (count > 0) {
                    context.Response.Write("{\"status\": \"ok\", \"message\": \"Usuário encontrado\"}");
                } else {
                    context.Response.Write("{\"status\": \"error\", \"message\": \"Usuário não encontrado ou CPF inválido em nosso sistema\"}");
                }
            }
        } catch (Exception ex) {
            context.Response.Write("{\"status\": \"error\", \"message\": \"Erro no servidor: " + ex.Message.Replace("\"", "'") + "\"}");
        }
    }

    public bool IsReusable { get { return false; } }
}
