<%@ WebHandler Language="C#" Class="PontoHandler" %>
using System;
using System.Web;
using System.Text;
using System.Data.SqlClient;
using System.Configuration;

public class PontoHandler : IHttpHandler {
    public void ProcessRequest (HttpContext context) {
        context.Response.ContentType = "application/json";
        
        try {
            string cn = ConfigurationManager.ConnectionStrings["cn"].ConnectionString;
            StringBuilder sb = new StringBuilder();
            
            using (SqlConnection conn = new SqlConnection(cn)) {
                conn.Open();
                
                // Debug: Listar tabelas para ver o que o Handler enxerga
                SqlCommand cmdDebug = new SqlCommand("SELECT name FROM sys.tables", conn);
                sb.Append("{\"db\":\"" + conn.Database + "\", \"tables\":[");
                using (SqlDataReader dr = cmdDebug.ExecuteReader()) {
                    bool f = true;
                    while (dr.Read()) {
                        if (!f) sb.Append(",");
                        sb.Append("\"" + dr[0].ToString() + "\"");
                        f = false;
                    }
                }
                sb.Append("]}");
            }
            context.Response.Write(sb.ToString());
            
        } catch (Exception ex) {
            context.Response.Write("{\"error\": \"" + ex.Message.Replace("\"", "'") + "\"}");
        }
    }
    public bool IsReusable { get { return false; } }
}
