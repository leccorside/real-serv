<%@ WebHandler Language="C#" Class="PontoHandler" %>
using System;
using System.Web;
using System.Text;
using System.Data;
using System.Data.SqlClient;
using System.Configuration;
using System.IO;

public class PontoHandler : IHttpHandler {
    string cn = ConfigurationManager.ConnectionStrings["cn"].ConnectionString;

    private string CleanJson(object val) {
        if (val == null || val == DBNull.Value) return "";
        return val.ToString().Trim().Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\r", "").Replace("\n", " ").Replace("\t", " ");
    }
    public void ProcessRequest(HttpContext context) {
        context.Response.ContentType = "application/json";
        string method = context.Request.HttpMethod;
        
        try {
            if (method == "GET") {
                if (context.Request.QueryString["acao"] == "excluir") {
                    HandleDelete(context);
                } else if (context.Request.QueryString["acao"] == "monitoramento") {
                    HandleMonitoramento(context);
                } else {
                    HandleGet(context);
                }
            } else if (method == "POST") {
                string acao = context.Request.Form["acao"];
                if (acao == "editar") {
                    HandleEdit(context);
                } else {
                    HandlePost(context);
                }
            } else if (method == "DELETE") {
                HandleDelete(context);
            } else {
                context.Response.Write("{\"status\": \"error\", \"message\": \"Método " + method + " não suportado\"}");
            }
        } catch (Exception ex) {
            context.Response.StatusCode = 500;
            context.Response.TrySkipIisCustomErrors = true;
            string msg = ex.Message.Replace("\\", "\\\\").Replace("\"", "'").Replace("\r", " ").Replace("\n", " ");
            context.Response.Write("{\"status\": \"error\", \"message\": \"" + msg + "\"}");
            try { File.WriteAllText(context.Server.MapPath("~/log_ponto_500.txt"), ex.ToString()); } catch {}
        }
    }

    private void HandlePost(HttpContext context) {
        string usuarioId = context.Request.Form["usuarioId"];
        string lat = context.Request.Form["latitude"];
        string lng = context.Request.Form["longitude"];
        string foto = context.Request.Form["foto"]; // Base64
        string batidaTipo = context.Request.Form["tipoBatida"] ?? "Entrada"; // Entrada, Almoço, etc.

        if (string.IsNullOrEmpty(usuarioId)) throw new Exception("Usuário ID obrigatório");
        
        bool isPessoaLogin = usuarioId.StartsWith("P");
        string cleanId = isPessoaLogin ? usuarioId.Substring(1) : usuarioId;

        using (SqlConnection conn = new SqlConnection(cn)) {
            conn.Open();
            
            string nomeFunc = "";
            string re = "";
            int pessoaId = 0;

            // Verifica se é um CPF (Offline Sync) pela flag que enviaremos no FormData (isCpf)
            // ou empiricamente: se não tiver letra e tamanho >= 11
            bool isFallbackCpf = context.Request.Form["isCpf"] == "true" || (cleanId.Length >= 11 && cleanId.Length <= 14 && !isPessoaLogin && System.Text.RegularExpressions.Regex.IsMatch(cleanId, @"^\d+$"));

            if (isFallbackCpf) {
                // Busca por Documento nativo na sincronização offline
                SqlCommand cmdCpf = new SqlCommand("SELECT Nome, PessoaID, RE FROM dbo.Pessoas WHERE REPLACE(REPLACE(REPLACE(REPLACE(Documento, '.', ''), '-', ''), '/', ''), ' ', '') = @doc AND RegStatus = 'A'", conn);
                cmdCpf.Parameters.AddWithValue("@doc", cleanId);
                using (SqlDataReader dr = cmdCpf.ExecuteReader()) {
                    if (dr.Read()) {
                        nomeFunc = dr["Nome"].ToString();
                        pessoaId = Convert.ToInt32(dr["PessoaID"]);
                        re = dr["RE"] != DBNull.Value ? dr["RE"].ToString() : "";
                    } else {
                        // Tentativa na tabela de Usuarios
                        dr.Close();
                        SqlCommand cmdUserCpf = new SqlCommand(@"SELECT u.UsuarioNome, u.PessoaID, p.RE FROM dbo.Usuarios u LEFT JOIN dbo.Pessoas p ON u.PessoaID = p.PessoaID WHERE REPLACE(REPLACE(REPLACE(REPLACE(u.UsuarioDocumento, '.', ''), '-', ''), '/', ''), ' ', '') = @doc AND u.RegStatus = 'A'", conn);
                        cmdUserCpf.Parameters.AddWithValue("@doc", cleanId);
                        using (SqlDataReader dr2 = cmdUserCpf.ExecuteReader()) {
                            if (dr2.Read()) {
                                nomeFunc = dr2["UsuarioNome"].ToString();
                                pessoaId = dr2["PessoaID"] != DBNull.Value ? Convert.ToInt32(dr2["PessoaID"]) : 0;
                                re = dr2["RE"] != DBNull.Value ? dr2["RE"].ToString() : "";
                            } else {
                                throw new Exception("Funcionário não encontrado pelo CPF durante sincronização");
                            }
                        }
                    }
                }
            }
            else if (isPessoaLogin) {
                // Login direto via Pessoas
                SqlCommand cmdPessoa = new SqlCommand("SELECT Nome, PessoaID, RE FROM dbo.Pessoas WHERE PessoaID = @pid", conn);
                cmdPessoa.Parameters.AddWithValue("@pid", cleanId);
                using (SqlDataReader dr = cmdPessoa.ExecuteReader()) {
                    if (dr.Read()) {
                        nomeFunc = dr["Nome"].ToString();
                        pessoaId = Convert.ToInt32(dr["PessoaID"]);
                        re = dr["RE"].ToString();
                    } else {
                        throw new Exception("Funcionário não encontrado");
                    }
                }
            } else {
                // Login via Usuarios
                SqlCommand cmdUser = new SqlCommand(@"
                    SELECT u.UsuarioNome, u.PessoaID, p.RE 
                    FROM dbo.Usuarios u 
                    LEFT JOIN dbo.Pessoas p ON u.PessoaID = p.PessoaID 
                    WHERE u.UsuarioId = @uid", conn);
                cmdUser.Parameters.AddWithValue("@uid", cleanId);
                
                using (SqlDataReader dr = cmdUser.ExecuteReader()) {
                    if (dr.Read()) {
                        nomeFunc = dr["UsuarioNome"].ToString();
                        pessoaId = dr["PessoaID"] != DBNull.Value ? Convert.ToInt32(dr["PessoaID"]) : 0;
                        re = dr["RE"].ToString();
                    } else {
                        throw new Exception("Usuário não encontrado");
                    }
                }
            }

            // 2. Buscar Posto de Servico (considera vinculo direto ou via tabela de ligação PostosDeServicosPessoas)
            string sqlPosto = @"
                SELECT TOP 1 PostoDeServicoNome FROM (
                    SELECT PostoDeServicoNome, PostoDeServicoId FROM dbo.PostosDeServicos WHERE PessoaId = @pid
                    UNION ALL
                    SELECT ps.PostoDeServicoNome, ps.PostoDeServicoId 
                    FROM dbo.PostosDeServicos ps 
                    JOIN dbo.PostosDeServicosPessoas psp ON ps.PostoDeServicoId = psp.PostoDeServicoId 
                    WHERE psp.PessoaId = @pid
                ) AS t ORDER BY PostoDeServicoId DESC";
            SqlCommand cmdPosto = new SqlCommand(sqlPosto, conn);
            cmdPosto.Parameters.AddWithValue("@pid", pessoaId);
            string postoNome = cmdPosto.ExecuteScalar() as string;
            if (string.IsNullOrWhiteSpace(postoNome)) postoNome = "Sem Posto de Serviço";

            // 3. Mapear o tipo de batida para a coluna do banco
            string colunaHora = "Entrada";
            if (batidaTipo.ToLower().Contains("almo") && batidaTipo.ToLower().Contains("saida")) colunaHora = "AlmocoSaida";
            else if (batidaTipo.ToLower().Contains("almo") && batidaTipo.ToLower().Contains("retorno")) colunaHora = "AlmocoRetorno";
            else if (batidaTipo.ToLower().Contains("saida")) colunaHora = "Saida";

            // 4. Verificar o registro atual do funcionário (Lógica de Plantão Noturno)
            // Se for Entrada, obriga a ser hoje. Se for Saídas/Almoço, pode resgatar o plantão que começou Ontem.
            string dateFilter = colunaHora == "Entrada" 
                ? "AND CONVERT(date, DataRegistro) = CONVERT(date, GETDATE())" 
                : "AND DataRegistro >= CONVERT(date, DATEADD(DAY, -1, GETDATE()))";

            SqlCommand cmdCheck = new SqlCommand(@"
                SELECT TOP 1 Id, " + colunaHora + @" 
                FROM dbo.ControlePonto 
                WHERE PessoaID = @pid 
                " + dateFilter + @"
                ORDER BY Id DESC", conn);
            cmdCheck.Parameters.AddWithValue("@pid", pessoaId);

            int existingId = 0;
            object existingValue = null;
            bool recordExists = false;

            using (SqlDataReader drCheck = cmdCheck.ExecuteReader()) {
                if (drCheck.Read()) {
                    recordExists = true;
                    existingId = Convert.ToInt32(drCheck["Id"]);
                    existingValue = drCheck[colunaHora];
                }
            }

            if (recordExists) {
                string valStr = existingValue != DBNull.Value ? existingValue.ToString().Trim() : "";
                if (!string.IsNullOrEmpty(valStr) && valStr != "--:--") {
                    context.Response.Write("{\"status\": \"error\", \"message\": \"Você já realizou a marcação de " + batidaTipo + " hoje.\"}");
                    return;
                }

                // 5. Atualizar Registro Existente
                string sqlUpdate = string.Format(@"
                    UPDATE dbo.ControlePonto 
                    SET {0} = @hora, Latitude = @lat, Longitude = @lng, Foto = @foto, PostoTrabalho = @posto 
                    WHERE Id = @id", colunaHora);

                SqlCommand cmdUpd = new SqlCommand(sqlUpdate, conn);
                cmdUpd.Parameters.AddWithValue("@id", existingId);
                cmdUpd.Parameters.AddWithValue("@hora", DateTime.Now.ToString("HH:mm"));
                cmdUpd.Parameters.AddWithValue("@lat", string.IsNullOrEmpty(lat) ? (object)DBNull.Value : lat);
                cmdUpd.Parameters.AddWithValue("@lng", string.IsNullOrEmpty(lng) ? (object)DBNull.Value : lng);
                cmdUpd.Parameters.AddWithValue("@foto", string.IsNullOrEmpty(foto) ? (object)DBNull.Value : foto);
                cmdUpd.Parameters.AddWithValue("@posto", postoNome);
                cmdUpd.ExecuteNonQuery();
            } else {
                // 6. Inserir Novo Registro (Primeira batida do dia)
                string sqlInsert = string.Format(@"
                    INSERT INTO dbo.ControlePonto 
                    (RE, NomeFuncionario, PostoTrabalho, DataRegistro, {0}, TipoRegistro, Latitude, Longitude, Foto, Situacao, PessoaID) 
                    VALUES 
                    (@re, @nome, @posto, CONVERT(date, GETDATE()), @hora, @tipo, @lat, @lng, @foto, 'Normal', @pid)", colunaHora);

                SqlCommand cmdIns = new SqlCommand(sqlInsert, conn);
                cmdIns.Parameters.AddWithValue("@re", string.IsNullOrEmpty(re) ? (object)DBNull.Value : re);
                cmdIns.Parameters.AddWithValue("@nome", nomeFunc);
                cmdIns.Parameters.AddWithValue("@posto", postoNome);
                cmdIns.Parameters.AddWithValue("@hora", DateTime.Now.ToString("HH:mm"));
                cmdIns.Parameters.AddWithValue("@tipo", "Aplicativo");
                cmdIns.Parameters.AddWithValue("@lat", string.IsNullOrEmpty(lat) ? (object)DBNull.Value : lat);
                cmdIns.Parameters.AddWithValue("@lng", string.IsNullOrEmpty(lng) ? (object)DBNull.Value : lng);
                cmdIns.Parameters.AddWithValue("@foto", string.IsNullOrEmpty(foto) ? (object)DBNull.Value : foto);
                cmdIns.Parameters.AddWithValue("@pid", pessoaId);
                cmdIns.ExecuteNonQuery();
            }
        }

        context.Response.Write("{\"status\": \"ok\", \"message\": \"Ponto registrado com sucesso via Aplicativo\"}");
    }

    private void HandleMonitoramento(HttpContext context) {
        using (SqlConnection conn = new SqlConnection(cn)) {
            conn.Open();

            // 1. Indicadores (Independente da contagem de linhas de ControlePonto)
            string sqlStats = @"
                SELECT 
                    (SELECT COUNT(*) FROM dbo.Pessoas WHERE RegStatus = 'A' AND RE <> '' AND RE IS NOT NULL) as Total,
                    (SELECT COUNT(*) FROM dbo.ControlePonto WHERE DataRegistro = CONVERT(date, GETDATE()) 
                        AND (Entrada IS NOT NULL AND Entrada <> '' AND Entrada <> '--:--') 
                        AND (Saida IS NULL OR Saida = '' OR Saida = '--:--')) as Presentes,
                    (SELECT COUNT(*) FROM dbo.ControlePonto WHERE DataRegistro = CONVERT(date, GETDATE()) 
                        AND (AlmocoSaida IS NOT NULL AND AlmocoSaida <> '' AND AlmocoSaida <> '--:--') 
                        AND (AlmocoRetorno IS NULL OR AlmocoRetorno = '' OR AlmocoRetorno = '--:--')) as EmIntervalo";
            
            int total = 0, presentes = 0, emIntervalo = 0;
            using (SqlCommand cmdStats = new SqlCommand(sqlStats, conn)) {
                using (SqlDataReader dr = cmdStats.ExecuteReader()) {
                    if (dr.Read()) {
                        total = dr.IsDBNull(0) ? 0 : Convert.ToInt32(dr[0]);
                        presentes = dr.IsDBNull(1) ? 0 : Convert.ToInt32(dr[1]);
                        emIntervalo = dr.IsDBNull(2) ? 0 : Convert.ToInt32(dr[2]);
                    }
                }
            }

            // 2. Lista de Funcionários
            string sqlLista = @"
                SELECT p.PessoaId, p.Nome, p.RE, cp.Entrada, cp.AlmocoSaida, cp.AlmocoRetorno, cp.Saida,
                       (SELECT TOP 1 ps.PostoDeServicoNome 
                        FROM dbo.PostosDeServicos ps 
                        JOIN dbo.PostosDeServicosPessoas psp ON ps.PostoDeServicoId = psp.PostoDeServicoId 
                        WHERE psp.PessoaId = p.PessoaId ORDER BY psp.PostoDeServicoPessoaId DESC) as Posto
                FROM dbo.Pessoas p
                LEFT JOIN dbo.ControlePonto cp ON p.PessoaId = cp.PessoaId AND cp.DataRegistro = CONVERT(date, GETDATE())
                WHERE p.RegStatus = 'A' AND p.RE <> '' AND p.RE IS NOT NULL
                ORDER BY cp.Entrada DESC, p.Nome ASC";

            StringBuilder sbItems = new StringBuilder();
            using (SqlCommand cmdLista = new SqlCommand(sqlLista, conn)) {
                using (SqlDataReader dr = cmdLista.ExecuteReader()) {
                    while (dr.Read()) {
                        if (sbItems.Length > 0) sbItems.Append(",");
                        
                        string entrada = dr["Entrada"].ToString().Trim();
                        string almSaida = dr["AlmocoSaida"].ToString().Trim();
                        string almRet = dr["AlmocoRetorno"].ToString().Trim();
                        string saida = dr["Saida"].ToString().Trim();
                        
                        string status = "FORA";
                        if (!string.IsNullOrEmpty(saida)) status = "FINALIZADO";
                        else if (!string.IsNullOrEmpty(almSaida) && string.IsNullOrEmpty(almRet)) status = "EM PAUSA";
                        else if (!string.IsNullOrEmpty(entrada)) status = "ATIVO";

                        sbItems.Append("{");
                        sbItems.Append("\"Nome\":\"" + CleanJson(dr["Nome"]) + "\",");
                        sbItems.Append("\"RE\":\"" + CleanJson(dr["RE"]) + "\",");
                        sbItems.Append("\"Posto\":\"" + CleanJson(dr["Posto"]) + "\",");
                        sbItems.Append("\"Entrada\":\"" + CleanJson(entrada) + "\",");
                        sbItems.Append("\"AlmocoSaida\":\"" + CleanJson(almSaida) + "\",");
                        sbItems.Append("\"AlmocoRetorno\":\"" + CleanJson(almRet) + "\",");
                        sbItems.Append("\"Saida\":\"" + CleanJson(saida) + "\",");
                        sbItems.Append("\"Status\":\"" + CleanJson(status) + "\"");
                        sbItems.Append("}");
                    }
                }
            }

            context.Response.Write("{");
            context.Response.Write("\"total\":" + total + ",\"presentes\":" + presentes + ",\"emIntervalo\":" + emIntervalo + ",");
            context.Response.Write("\"data\":[" + sbItems.ToString() + "]");
            context.Response.Write("}");
        }
    }

    private void HandleGet(HttpContext context) {
        string busca = context.Request.QueryString["busca"] ?? "";
        string dataIni = context.Request.QueryString["dataInicial"];
        string dataFim = context.Request.QueryString["dataFinal"];

        StringBuilder sb = new StringBuilder();
        sb.Append("[");

        using (SqlConnection conn = new SqlConnection(cn)) {
            conn.Open();

            string sql;
            SqlCommand cmd;

            // Busca exata por PessoaID (ex: busca=P17360) — app mobile usa este formato
            int pessoaIdBusca = 0;
            bool isPessoaIdSearch = busca.StartsWith("P") && int.TryParse(busca.Substring(1), out pessoaIdBusca);

            // Suporte a busca por CPF puro (11 dígitos numéricos) — usado no app mobile após login offline/facial
            bool isCpfSearch = !isPessoaIdSearch && System.Text.RegularExpressions.Regex.IsMatch(busca, @"^\d{11,14}$");
            if (isCpfSearch) {
                string cleanDoc = busca;
                SqlCommand cmdResolve = new SqlCommand("SELECT PessoaID FROM dbo.Pessoas WHERE REPLACE(REPLACE(REPLACE(REPLACE(Documento, '.', ''), '-', ''), '/', ''), ' ', '') = @doc AND RegStatus = 'A'", conn);
                cmdResolve.Parameters.AddWithValue("@doc", cleanDoc);
                object pidObj = cmdResolve.ExecuteScalar();
                if (pidObj != null && pidObj != DBNull.Value) {
                    pessoaIdBusca = Convert.ToInt32(pidObj);
                    isPessoaIdSearch = true; // Tratar como busca por PessoaID a partir daqui
                }
            }
            
            if (isPessoaIdSearch) {
                // Filtro exato: só registros deste PessoaID específico
                sql = @"
                    SELECT cp.*, 
                           p.HorarioDe as PrevEntrada, 
                           p.HorarioAte as PrevSaida, 
                           p.IntervaloDe as PrevAlmocoIni, 
                           p.IntervaloAte as PrevAlmocoFim 
                    FROM dbo.ControlePonto cp 
                    LEFT JOIN dbo.Pessoas p ON cp.PessoaID = p.PessoaID
                    WHERE cp.PessoaID = @pid";
                
                if (!string.IsNullOrEmpty(dataIni)) sql += " AND CONVERT(date, cp.DataRegistro) >= @d1";
                if (!string.IsNullOrEmpty(dataFim)) sql += " AND CONVERT(date, cp.DataRegistro) <= @d2";
                sql += " ORDER BY cp.Id DESC";

                cmd = new SqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("@pid", pessoaIdBusca);
            } else {
                // Busca genérica por nome/RE/posto (painel web admin)
                // Se for UsuarioId ou PessoaId numérico, resolve o RE primeiro
                if (!string.IsNullOrEmpty(busca) && busca.Length < 10 && !busca.Contains(" ")) {
                    string cleanBusca = busca.Replace("P", "");
                    int id;
                    if (int.TryParse(cleanBusca, out id)) {
                        string sqlRE = busca.StartsWith("P")
                            ? "SELECT RE FROM dbo.Pessoas WHERE PessoaID = @id"
                            : "SELECT p.RE FROM dbo.Usuarios u JOIN dbo.Pessoas p ON u.PessoaID = p.PessoaID WHERE u.UsuarioId = @id";
                        SqlCommand cmdRE = new SqlCommand(sqlRE, conn);
                        cmdRE.Parameters.AddWithValue("@id", id);
                        string resolvedRE = cmdRE.ExecuteScalar() as string;
                        if (!string.IsNullOrEmpty(resolvedRE)) busca = resolvedRE;
                    }
                }

                sql = @"
                    SELECT cp.*, 
                           p.HorarioDe as PrevEntrada, 
                           p.HorarioAte as PrevSaida, 
                           p.IntervaloDe as PrevAlmocoIni, 
                           p.IntervaloAte as PrevAlmocoFim 
                    FROM dbo.ControlePonto cp 
                    LEFT JOIN dbo.Pessoas p ON (cp.PessoaID = p.PessoaID OR (ISNULL(cp.PessoaID, 0) = 0 AND cp.RE = p.RE AND cp.RE <> '' AND cp.RE IS NOT NULL))
                    WHERE (cp.NomeFuncionario LIKE @b OR cp.RE LIKE @b OR cp.PostoTrabalho LIKE @b)";

                if (!string.IsNullOrEmpty(dataIni)) sql += " AND CONVERT(date, cp.DataRegistro) >= @d1";
                if (!string.IsNullOrEmpty(dataFim)) sql += " AND CONVERT(date, cp.DataRegistro) <= @d2";
                sql += " ORDER BY cp.Id DESC";

                cmd = new SqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("@b", "%" + busca + "%");
            }

            if (!string.IsNullOrEmpty(dataIni)) cmd.Parameters.AddWithValue("@d1", dataIni);
            if (!string.IsNullOrEmpty(dataFim)) cmd.Parameters.AddWithValue("@d2", dataFim);

            using (SqlDataReader dr = cmd.ExecuteReader()) {
                DataTable dtPonto = new DataTable();
                dtPonto.Load(dr);

                bool first = true;
                foreach (DataRow rowPonto in dtPonto.Rows) {
                    if (!first) sb.Append(",");
                    sb.Append("{");
                    
                    // Dados do Ponto
                    for (int i = 0; i < dtPonto.Columns.Count; i++) {
                        if (i > 0) sb.Append(",");
                        string name = dtPonto.Columns[i].ColumnName;
                        object val = rowPonto[i];
                        string valStr;
                        if (val == DBNull.Value) valStr = "null";
                        else if (val is DateTime) valStr = "\"" + ((DateTime)val).ToString("yyyy-MM-dd HH:mm:ss") + "\"";
                        else valStr = "\"" + val.ToString().Replace("\"", "\\\"").Replace("\r", "").Replace("\n", " ") + "\"";
                        sb.Append("\"" + name + "\":" + valStr);
                    }

                    // Buscar Ocorrências do dia para este funcionário
                    int pid = 0;
                    if (rowPonto["PessoaID"] != DBNull.Value) pid = Convert.ToInt32(rowPonto["PessoaID"]);
                    DateTime dtReg = rowPonto["DataRegistro"] != DBNull.Value ? (DateTime)rowPonto["DataRegistro"] : DateTime.MinValue;

                    sb.Append(",\"Ocorrencias\": [");
                    if (pid > 0 && dtReg != DateTime.MinValue) {
                        string sqlOcor = @"
                            SELECT o.OcorrenciaId, o.Resolvido, o.OcorrenciaDescricao, o.Solucao, 
                                   ot.OcorrenciaTipoNome, 
                                   u.UsuarioNome as ExecutorNome,
                                   o.Solicitante as SolicitanteNome
                            FROM dbo.Ocorrencias o
                            LEFT JOIN dbo.OcorrenciasTipos ot ON o.OcorrenciaTipoId = ot.OcorrenciaTipoId
                            LEFT JOIN dbo.Usuarios u ON o.UsuarioId = u.UsuarioId
                            WHERE (o.FuncionarioId = @pid OR o.PessoaId = @pid)
                            AND CONVERT(date, o.RegDtInicio) = CONVERT(date, @dt)";
                        
                        using (SqlConnection connOcor = new SqlConnection(cn)) {
                            connOcor.Open();
                            using (SqlCommand cmdOcor = new SqlCommand(sqlOcor, connOcor)) {
                                cmdOcor.Parameters.AddWithValue("@pid", pid);
                                cmdOcor.Parameters.AddWithValue("@dt", dtReg);
                                using (SqlDataReader drOcor = cmdOcor.ExecuteReader()) {
                                    bool firstOcor = true;
                                    while (drOcor.Read()) {
                                        if (!firstOcor) sb.Append(",");
                                        sb.Append("{");
                                        sb.Append("\"Id\": " + drOcor["OcorrenciaId"] + ",");
                                        sb.Append("\"Situacao\": \"" + (Convert.ToBoolean(drOcor["Resolvido"]) ? "Resolvido" : "Pendente") + "\",");
                                        sb.Append("\"Tipo\": \"" + drOcor["OcorrenciaTipoNome"].ToString().Replace("\"", "'") + "\",");
                                        sb.Append("\"Descricao\": \"" + drOcor["OcorrenciaDescricao"].ToString().Replace("\"", "'").Replace("\r", " ").Replace("\n", " ") + "\",");
                                        sb.Append("\"Solucao\": \"" + drOcor["Solucao"].ToString().Replace("\"", "'").Replace("\r", " ").Replace("\n", " ") + "\",");
                                        sb.Append("\"Executor\": \"" + drOcor["ExecutorNome"].ToString().Replace("\"", "'") + "\",");
                                        sb.Append("\"Solicitante\": \"" + drOcor["SolicitanteNome"].ToString().Replace("\"", "'") + "\"");
                                        sb.Append("}");
                                        firstOcor = false;
                                    }
                                }
                            }
                        }
                    }
                    sb.Append("]");

                    sb.Append("}");
                    first = false;
                }
            }
        }
        sb.Append("]");
        context.Response.Write(sb.ToString());
    }

    private void HandleDelete(HttpContext context) {
        string id = context.Request.QueryString["id"];
        if (string.IsNullOrEmpty(id)) throw new Exception("ID obrigatório");
        
        using (SqlConnection conn = new SqlConnection(cn)) {
            SqlCommand cmd = new SqlCommand("DELETE FROM dbo.ControlePonto WHERE Id = @id", conn);
            cmd.Parameters.AddWithValue("@id", id);
            conn.Open();
            cmd.ExecuteNonQuery();
        }
        context.Response.Write("{\"status\": \"ok\", \"message\": \"Excluído com sucesso\"}");
    }

    private void HandleEdit(HttpContext context) {
        string id = context.Request.Form["id"];
        string re = context.Request.Form["re"];
        string nome = context.Request.Form["nome"];
        string posto = context.Request.Form["posto"];
        string data = context.Request.Form["data"];
        string entrada = context.Request.Form["entrada"];
        string almocoSaida = context.Request.Form["almocoSaida"];
        string almocoRetorno = context.Request.Form["almocoRetorno"];
        string saida = context.Request.Form["saida"];
        string supervisao = context.Request.Form["supervisao"];
        string tipo = context.Request.Form["tipo"];
        string obs = context.Request.Form["obs"];
        string situacao = context.Request.Form["situacao"];

        if (string.IsNullOrEmpty(id)) throw new Exception("ID obrigat&oacute;rio para edi&ccedil;&atilde;o");
        if (string.IsNullOrEmpty(re)) throw new Exception("RE &eacute; obrigat&oacute;rio");
        if (string.IsNullOrEmpty(nome)) throw new Exception("Nome do Funcion&aacute;rio &eacute; obrigat&oacute;rio");
        if (string.IsNullOrEmpty(data)) throw new Exception("Data do Registro &eacute; obrigat&oacute;ria");

        DateTime dtRegistro;
        if (!DateTime.TryParse(data, out dtRegistro)) throw new Exception("Data do Registro inválida: " + data);

        using (SqlConnection conn = new SqlConnection(cn)) {
            string sql = @"UPDATE dbo.ControlePonto 
                           SET RE = @re, NomeFuncionario = @nome, PostoTrabalho = @posto, 
                               DataRegistro = @data, Entrada = @e, AlmocoSaida = @as, 
                               AlmocoRetorno = @ar, Saida = @s, Supervisao = @sup, 
                               TipoRegistro = @tipo, Observacoes = @obs, Situacao = @sit
                           WHERE Id = @id";
            SqlCommand cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);
            cmd.Parameters.AddWithValue("@re", re);
            cmd.Parameters.AddWithValue("@nome", nome);
            cmd.Parameters.AddWithValue("@posto", posto ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@data", dtRegistro);
            cmd.Parameters.AddWithValue("@e", string.IsNullOrWhiteSpace(entrada) || entrada == "--:--" ? (object)DBNull.Value : entrada);
            cmd.Parameters.AddWithValue("@as", string.IsNullOrWhiteSpace(almocoSaida) || almocoSaida == "--:--" ? (object)DBNull.Value : almocoSaida);
            cmd.Parameters.AddWithValue("@ar", string.IsNullOrWhiteSpace(almocoRetorno) || almocoRetorno == "--:--" ? (object)DBNull.Value : almocoRetorno);
            cmd.Parameters.AddWithValue("@s", string.IsNullOrWhiteSpace(saida) || saida == "--:--" ? (object)DBNull.Value : saida);
            cmd.Parameters.AddWithValue("@sup", supervisao ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@tipo", tipo ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@obs", obs ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@sit", situacao ?? (object)DBNull.Value);
            
            conn.Open();
            cmd.ExecuteNonQuery();
        }
        context.Response.Write("{\"status\": \"ok\", \"message\": \"Registro atualizado com sucesso\"}");
    }

    public bool IsReusable { get { return false; } }
}
