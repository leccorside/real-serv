<%@ WebHandler Language="C#" Class="TestHandler" %>
using System;
using System.Web;
using System.Drawing;

public class TestHandler : IHttpHandler {
    public void ProcessRequest (HttpContext context) {
        context.Response.ContentType = "application/json";
        try {
            using (Bitmap bmp = new Bitmap(1, 1)) {
                context.Response.Write("{\"status\": \"ok\", \"message\": \"System.Drawing is available\"}");
            }
        } catch (Exception ex) {
            context.Response.Write("{\"status\": \"error\", \"message\": \"" + ex.Message + "\"}");
        }
    }
    public bool IsReusable { get { return false; } }
}
