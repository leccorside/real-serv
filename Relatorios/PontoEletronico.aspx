<%@ Page Language="C#" %>
<%@ Import Namespace="System.Linq" %>
<%@ Import Namespace="System.Collections.Generic" %>
<%@ Import Namespace="System.Web.Mvc" %>
<%
    // Verificação de Acesso
    if (BLL.Usuarios.GetUsuarioId() == 0) Response.Redirect("~/Home/Index");

    var user        = new BLL.Usuarios();
    var dadosUser   = user.Carregar(BLL.Usuarios.GetUsuarioId());
    var filialId    = BLL.Usuarios.GetFilialId();
    var empresaId   = BLL.Usuarios.GetEmpresaId();

    // Logo
    var logoUrl    = ResolveUrl("~/Assets/img/logotipos/" + empresaId + ".png?" + DateTime.Now.Month);
    var semLogoUrl = ResolveUrl("~/Assets/img/logotipos/semlogo.png");

    // Foto sidebar
    var foto    = ResolveUrl("~/Assets/img/logointerno/" + empresaId + "_" + filialId + "Interna.jpg?" + DateTime.Now.Second);
    var semfoto = ResolveUrl("~/Assets/_fortuna/images/semfoto.png");

    // Filiais
    var bllFiliais        = new BLL.Filiais();
    var bllUsuariosFiliais = new BLL.UsuariosFiliais();
    SelectList listaFiliais = (SelectList)bllFiliais.ListarTipos(true);
    if (BLL.Usuarios.GetVisualizaOutrasFiliais())
        listaFiliais = (SelectList)bllUsuariosFiliais.ListarTiposAcessos(BLL.Usuarios.GetUsuarioId());

    SelectListItem selectedFilial = listaFiliais.FirstOrDefault(x => x.Value == filialId.ToString());
    if (selectedFilial != null)
        listaFiliais = new SelectList(listaFiliais, "value", "text", selectedFilial.Value);

    // Controles de acesso
    var index_agendamento    = user.ControleAcesso("index",    "agendamento");
    var agenda_agendamento   = user.ControleAcesso("agenda",   "agendamento");
    var calendario_agendamento = user.ControleAcesso("calendario","agendamento");
%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Ponto Eletr&ocirc;nico</title>

    <link href='http://fonts.googleapis.com/css?family=Open+Sans:400,300,600,700' rel='stylesheet' type='text/css'>

    <!-- Estilos Fortuna (mesmos bundles do _FortunaLayout) -->
    <link href="<%= ResolveUrl("~/Assets/_fortuna/vendor/fontawesome/css/font-awesome.css") %>" rel="stylesheet" />
    <link href="<%= ResolveUrl("~/Assets/_fortuna/vendor/animate.css/animate.css") %>" rel="stylesheet" />
    <link href="<%= ResolveUrl("~/Assets/_fortuna/vendor/bootstrap/dist/css/bootstrap.css") %>" rel="stylesheet" />
    <link href="<%= ResolveUrl("~/Assets/_fortuna/fonts/pe-icon-7-stroke/css/pe-icon-7-stroke.css") %>" rel="stylesheet" />
    <link href="<%= ResolveUrl("~/Assets/_fortuna/vendor/metisMenu/dist/metisMenu.css") %>" rel="stylesheet" />
    <link href="<%= ResolveUrl("~/Assets/_fortuna/styles/style.css") %>" rel="stylesheet">
    <link href="<%= ResolveUrl("~/Assets/css/custom.css?v=1.4") %>" rel="stylesheet" />

    <style>
        /* Estilos do conteúdo de ponto */
        :root {
            --primary-color: #2563eb;
            --bg-gray:       #f8fafc;
            --border-color:  #e2e8f0;
            --text-main:     #1e293b;
            --text-muted:    #64748b;
        }
        .ponto-container { background:white; padding:24px; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
        .ponto-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:32px; }
        .ponto-title h2 { margin:0; font-size:22px; color:var(--text-main); font-weight:700; display:flex; align-items:center; gap:12px; }
        .ponto-title span { font-size:13px; color:var(--text-muted); font-weight:400; border-left:1px solid var(--border-color); padding-left:12px; }
        .header-actions { display:flex; gap:12px; }
        .btn-export { display:flex; align-items:center; gap:8px; padding:8px 16px; border:1px solid var(--border-color); border-radius:8px; background:white; color:var(--text-main); font-size:14px; cursor:pointer; }
        .btn-export:hover { background:var(--bg-gray); }
        .btn-pdf i { color:#ef4444; } .btn-excel i { color:#10b981; }
        .btn-monitoramento i { color:var(--primary-color); }
        .filters-section { display:grid; grid-template-columns:2fr 1fr 1fr auto; gap:16px; align-items:flex-end; margin-bottom:24px; }
        .filter-group { display:flex; flex-direction:column; gap:8px; }
        .filter-group label { font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; }
        .filter-input { width:100%; padding:10px 12px; border:1px solid var(--border-color); border-radius:8px; font-size:14px; outline:none; box-sizing:border-box; }
        .filter-input:focus { border-color:var(--primary-color); }
        .btn-filter { padding:10px 16px; background:var(--bg-gray); border:1px solid var(--border-color); border-radius:8px; color:var(--text-main); font-size:14px; cursor:pointer; display:flex; align-items:center; gap:8px; }
        .ponto-table-container { border:1px solid var(--border-color); border-radius:12px; overflow:hidden; }
        .ponto-table { width:100%; border-collapse:collapse; font-size:13px; background:white; }
        .ponto-table th { background:var(--bg-gray); padding:12px 16px; text-align:left; color:var(--text-muted); font-size:11px; font-weight:600; text-transform:uppercase; }
        .ponto-table td { padding:12px 16px; border-top:1px solid var(--border-color); color:var(--text-main); }
        .ponto-table tr:hover td { background:#fbfcfd; }
        .status-entrada { color:#10b981; font-weight:600; }
        .status-falta   { color:#ef4444; font-weight:600; }
        .action-icons { display:flex; gap:12px; }
        .action-icons i { cursor:pointer; font-size:15px; transition:opacity .2s; }
        .action-icons i:hover { opacity:.7; }

        /* Painel de Monitoramento (Full Screen Modal) */
        .modal-monitoramento .modal-dialog { width:100%; height:100%; margin:0; padding:0; }
        .modal-monitoramento .modal-content { height:100%; border:none; border-radius:0; background:#f0f2f5; overflow-y:auto; }
        .mon-header { padding:40px 60px 20px 60px; }
        .mon-header h1 { font-weight:800; color:#1e293b; font-size:28px; text-transform:uppercase; letter-spacing:-0.5px; }
        .mon-stats { display:grid; grid-template-columns:1fr 1fr 1fr; gap:30px; padding:0 60px 40px 60px; }
        .stat-card { background:white; padding:30px; border-radius:12px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05); text-align:center; position:relative; overflow:hidden; }
        .stat-card.border-green { border-left:6px solid #10b981; }
        .stat-card.border-blue { border-left:6px solid #3b82f6; }
        .stat-card.border-green { border-left:6px solid #10b981; }
        .stat-card.border-orange { border-left:6px solid #f59e0b; }
        .stat-card label { display:block; text-transform:uppercase; font-size:11px; font-weight:700; color:#64748b; margin-bottom:10px; }
        .stat-card .value { font-size:42px; font-weight:800; color:#1e293b; letter-spacing:-1px; }
        .stat-card.border-blue .value { color:#3b82f6; }
        .stat-card.border-green .value { color:#10b981; }
        .stat-card.border-orange .value { color:#f59e0b; }
        
        .mon-body { padding:0 60px 60px 60px; }
        .mon-table-card { background:white; border-radius:12px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05); padding:20px; }
        .mon-table-title { border-bottom:1px solid #f1f5f9; padding-bottom:20px; margin-bottom:20px; display:flex; align-items:center; gap:10px; }
        .mon-table-title h3 { margin:0; font-size:18px; color:#1e293b; font-weight:700; }
        .mon-table-title span { color:#94a3b8; font-size:14px; font-weight:400; }
        
        .mon-table { width:100%; }
        .mon-table th { color:#94a3b8; font-size:11px; font-weight:700; text-transform:uppercase; padding:15px; border-bottom:1px solid #f1f5f9; }
        .mon-table td { padding:18px 15px; border-bottom:1px solid #f8fafc; font-size:14px; vertical-align:middle; }
        .mon-table tr:last-child td { border-bottom:none; }
        .mon-name { font-weight:700; color:#1e293b; display:block; }
        .mon-sub { font-size:12px; color:#94a3b8; }
        .mon-time { font-weight:600; color:#1e293b; }
        
        .badge-status { padding:6px 12px; border-radius:6px; font-size:11px; font-weight:800; text-transform:uppercase; white-space:nowrap; }
        .badge-ativo { background:#ecfdf5; color:#10b981; }
        .badge-em-pausa { background-color: #f97316 !important; color: white; } /* Laranja */
        .badge-atrasado { background:#fef2f2; color:#ef4444; }
        .badge-finalizado { background:#f1f5f9; color:#64748b; }
        .badge-fora { background:#fafafa; color:#cbd5e1; }

        /* Garantir visibilidade dos Modais */
        .modal { z-index: 10050 !important; }
        .modal-backdrop { z-index: 10040 !important; }
        .modal.in .modal-dialog { transform: none !important; opacity: 1 !important; visibility: visible !important; }
        
        .mon-footer { position:fixed; bottom:0; width:100%; background:white; padding:15px 60px; border-top:1px solid #f1f5f9; display:flex; justify-content:space-between; font-size:12px; color:#94a3b8; z-index:100; }
        .mon-footer b { color:#2563eb; }
        .btn-close-mon { position:absolute; top:40px; right:60px; background:none; border:none; font-size:24px; color:#94a3b8; cursor:pointer; }
        .btn-close-mon:hover { color:#1e293b; }

        /* Paginação */
        .pagination-container { display:flex; justify-content:space-between; align-items:center; padding:20px 0; border-top:1px solid #f1f5f9; margin-top:10px; }
        .pagination-info { font-size:13px; color:#64748b; }
        .pagination-controls { display:flex; gap:5px; align-items:center; }
        .page-btn { padding:6px 12px; border:1px solid #e2e8f0; border-radius:6px; background:white; color:#64748b; font-size:13px; cursor:pointer; font-weight:600; transition:all 0.2s; min-width:38px; }
        .page-btn:hover { background:#f8fafc; color:#2563eb; border-color:#2563eb; }
        .page-btn.active { background:#2563eb; color:white; border-color:#2563eb; }
        .page-btn:disabled { opacity:0.5; cursor:not-allowed; background:#f1f5f9; }
        .page-dots { color:#94a3b8; padding:0 5px; }
        .mon-search-box { position:relative; margin-bottom:20px; }
        .mon-search-box input { width:100%; padding:12px 16px 12px 44px; border:1px solid #e2e8f0; border-radius:10px; font-size:14px; outline:none; background:#f8fafc; color:#1e293b; box-sizing:border-box; }
        .mon-search-box input:focus { border-color:#3b82f6; background:white; box-shadow:0 0 0 3px rgba(59,130,246,0.1); }
        .mon-search-box i { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:15px; }
        .mon-search-count { font-size:12px; color:#94a3b8; margin-left:auto; padding:4px 10px; background:#f1f5f9; border-radius:20px; }
        .mon-table tr.hidden-by-search { display:none; }
    </style>
</head>
<body class="fixed-navbar">

    <!-- Splash Screen -->
    <div class="splash">
        <div class="color-line"></div>
        <div class="splash-title">
            <h1></h1>
            <p>Carregando recursos do Sistema</p>
            <div class="spinner">
                <div class="rect1"></div><div class="rect2"></div><div class="rect3"></div>
                <div class="rect4"></div><div class="rect5"></div>
            </div>
        </div>
    </div>

    <!-- ============================================================ -->
    <!-- HEADER (replica _FortunaHeader) -->
    <!-- ============================================================ -->
    <div id="header">
        <div class="color-line"></div>
        <div id="logo" class="light-version" style="overflow:hidden;">
            <a class="brand" href="<%= ResolveUrl("~/Principal/Index") %>">
                <img src="<%= logoUrl %>" onerror="this.src='<%= semLogoUrl %>';" style="max-height:35px;max-width:130px;" />
            </a>
        </div>
        <nav role="navigation">
            <div class="header-link hide-menu"><i class="fa fa-bars"></i></div>
            <div class="small-logo"></div>
            <div class="navbar-right">
                <ul class="nav navbar-nav no-borders">

                    <!-- Home -->
                    <li class="dropdown">
                        <a href="<%= ResolveUrl("~/Principal/Index") %>">
                            <i class="pe-7s-home"></i>
                        </a>
                    </li>

                    <!-- Pesquisa Rápida -->
                    <% if (user.ControleAcesso("pesquisarapida", "pessoas")) { %>
                    <li class="dropdown">
                        <a href="<%= ResolveUrl("~/Pessoas/PesquisaRapida/") %>" class="btn">
                            <i class="pe-7s-search"></i>
                        </a>
                    </li>
                    <% } %>

                    <!-- Menu Keypad (Dados do usuário) -->
                    <li class="dropdown">
                        <a class="dropdown-toggle" href="#" data-toggle="dropdown">
                            <i class="pe-7s-keypad"></i>
                        </a>
                        <div class="dropdown-menu hdropdown bigmenu animated flipInX">
                            <table><tbody>
                                <tr>
                                    <td>
                                        <a href="<%= ResolveUrl("~/Perfil/SeusDados") %>">
                                            <i class="pe pe-7s-user text-info"></i>
                                            <h5>Seus Dados</h5>
                                        </a>
                                    </td>
                                    <td>
                                        <a href="<%= ResolveUrl("~/Perfil/SuaSenha") %>">
                                            <i class="pe pe-7s-key text-warning"></i>
                                            <h5>Sua Senha</h5>
                                        </a>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <a href="<%= ResolveUrl("~/Principal/RenovaCredenciais") %>">
                                            <i class="pe pe-7s-refresh text-success"></i>
                                            <h5>Renovar Credenciais</h5>
                                        </a>
                                    </td>
                                </tr>
                            </tbody></table>
                        </div>
                    </li>

                    <!-- Logoff -->
                    <li class="dropdown">
                        <a href="#" id="logoff" class="logoff">
                            <i class="pe-7s-close"></i>
                        </a>
                    </li>

                </ul>
            </div>
        </nav>
    </div>

    <!-- ============================================================ -->
    <!-- SIDEBAR / NAVIGATION (replica _FortunaNavigation) -->
    <!-- ============================================================ -->
    <aside id="menu">
        <div id="navigation">
            <div class="profile-picture">
                <a href="<%= ResolveUrl("~/Principal/Perfil/") %>">
                    <img src="<%= foto %>" onerror="this.onerror=null;this.src='<%= semfoto %>';"
                         class="img-circle m-b" alt="logo" style="max-width:95px;max-height:95px;">
                </a>
                <div class="stats-label text-color">
                    <span class="font-extra-bold font-uppercase"><%= BLL.Usuarios.GetUsuarioNome() %></span>

                    <% if (listaFiliais.Any()) { %>
                    <div class="dropdown">
                        <a class="dropdown-toggle" href="#" data-toggle="dropdown">
                            <% if (filialId > 0) {
                                   var filialAtual = listaFiliais.FirstOrDefault(x => x.Value == filialId.ToString());
                                   if (filialAtual != null) { %>
                                       <small class="text-muted"><%= filialAtual.Text %> <b class="caret"></b></small>
                            <%     } } else { %>
                                <small class="text-muted">Selecione a <%= BLL.Usuarios.GetEntidadeFilial() %><b class="caret"></b></small>
                            <% } %>
                        </a>
                        <ul class="dropdown-menu animated flipInX m-t-xs">
                            <% if (BLL.Usuarios.GetUtilizaFilial() && (BLL.Usuarios.GetFilialIDMaster() == 0 || BLL.Usuarios.GetVisualizaOutrasFiliais())) {
                                   foreach (var item in listaFiliais) { %>
                                       <li class="<%= (item.Value == filialId.ToString() ? "active" : "") %>">
                                           <a href="<%= ResolveUrl("~/Acessos/SelecionarFilial/" + item.Value) %>"><%= item.Text %></a>
                                       </li>
                            <%     }
                                   %><li class="divider"></li><%
                               } %>
                            <li><a href="#" class="logoff">Logout</a></li>
                        </ul>
                    </div>
                    <% } %>
                </div>
            </div>

            <ul class="nav" id="side-menu">

                <% if (index_agendamento || agenda_agendamento || calendario_agendamento) { %>
                <li>
                    <a href="#"><span class="nav-label">Agenda</span><span class="fa arrow"></span></a>
                    <ul class="nav nav-second-level collapse" aria-expanded="false">
                        <% if (index_agendamento) { %><li><a href="<%= ResolveUrl("~/Agendamento/ProgramacaoDia") %>">Programação do Dia</a></li><% } %>
                        <% if (agenda_agendamento) { %><li><a href="<%= ResolveUrl("~/Agendamento/Agenda") %>">Agenda Geral</a></li><% } %>
                        <% if (calendario_agendamento) { %><li><a href="<%= ResolveUrl("~/Agendamento/Calendario") %>">Minha Agenda</a></li><% } %>
                    </ul>
                </li>
                <% } %>

                <% if (user.ControleAcesso("index", "postosdeservicos")) { %>
                <li><a href="<%= ResolveUrl("~/PostosDeServicos/Index/0/") %>"><span class="nav-label">Postos de Servi&ccedil;os</span></a></li>
                <% } %>

                <% if (user.ControleAcesso("index", "ocorrencias")) { %>
                <li><a href="<%= ResolveUrl("~/Ocorrencias/Index/0/") %>"><span class="nav-label">Ocorr&ecirc;ncias</span></a></li>
                <% } %>

                <% if (user.ControleAcesso("index", "supervisoes")) { %>
                <li><a href="<%= ResolveUrl("~/Supervisoes/Index/0/") %>"><span class="nav-label">Supervis&otilde;es</span></a></li>
                <% } %>

                <% if (user.ControleAcesso("index", "pessoas")) { %>
                <li>
                    <a href="#"><span class="nav-label">Cadastros</span><span class="fa arrow"></span></a>
                    <ul class="nav nav-second-level collapse" aria-expanded="false">
                        <% if (user.ControleAcesso("CriarC", "pessoas")) { %><li><a href="<%= ResolveUrl("~/Pessoas/Index/0/C") %>"><%= BLL.Usuarios.GetEntidadeCliente() %></a></li><% } %>
                        <% if (user.ControleAcesso("CriarF", "pessoas")) { %><li><a href="<%= ResolveUrl("~/Pessoas/Index/0/F") %>"><%= BLL.Usuarios.GetEntidadeFornecedor() %></a></li><% } %>
                        <% if (user.ControleAcesso("CriarO", "pessoas")) { %><li><a href="<%= ResolveUrl("~/Pessoas/Index/0/O") %>"><%= BLL.Usuarios.GetEntidadeFuncionario() %></a></li><% } %>
                    </ul>
                </li>
                <% } %>

                <% if (user.ControleAcesso("index", "produtos")) { %>
                <li>
                    <a href="#"><span class="nav-label">Produtos</span><span class="fa arrow"></span></a>
                    <ul class="nav nav-second-level collapse" aria-expanded="false">
                        <li><a href="<%= ResolveUrl("~/Produtos/Index/0") %>">Listar produtos</a></li>
                    </ul>
                </li>
                <% } %>

                <% if (BLL.Usuarios.VerificaAcessoPorControle("relatorios")) { %>
                <li class="active">
                    <a href="#"><span class="nav-label">Relat&oacute;rios</span><span class="fa arrow"></span></a>
                    <ul class="nav nav-second-level collapse in" aria-expanded="true">
                        <% if (user.ControleAcesso("AgendaProfissional", "relatorios")) { %><li><a href="<%= ResolveUrl("~/Relatorios/AgendaProfissional/") %>">Agenda <%= BLL.Usuarios.GetEntidadeFuncionario() %></a></li><% } %>
                        <% if (user.ControleAcesso("ListaPresencaProfissional", "relatorios")) { %><li><a href="<%= ResolveUrl("~/Relatorios/ListaPresencaProfissional/") %>">Lista de presen&ccedil;a</a></li><% } %>
                        <% if (user.ControleAcesso("Fechamento", "relatorios")) { %><li><a href="<%= ResolveUrl("~/Relatorios/Fechamento/") %>">Fechamento</a></li><% } %>
                        <% if (user.ControleAcesso("FechamentoFinanceiro", "relatorios")) { %><li><a href="<%= ResolveUrl("~/Relatorios/FechamentoFinanceiro/") %>">Fechamento Financeiro</a></li><% } %>
                        <% if (user.ControleAcesso("RelatorioFichas", "relatorios")) { %><li><a href="<%= ResolveUrl("~/Relatorios/RelatorioFichas/") %>">Relat&oacute;rio Fichas</a></li><% } %>
                        <% if (user.ControleAcesso("RelatorioClientes", "relatorios")) { %><li><a href="<%= ResolveUrl("~/Relatorios/RelatorioClientes/") %>"><%= BLL.Usuarios.GetEntidadeCliente() %></a></li><% } %>
                        <% if (user.ControleAcesso("RelatorioAniversariantes", "relatorios")) { %><li><a href="<%= ResolveUrl("~/Relatorios/RelatorioAniversariantes/") %>">Aniversariantes</a></li><% } %>
                        <li class="active"><a href="<%= ResolveUrl("~/Relatorios/PontoEletronico.aspx") %>">Ponto Eletr&ocirc;nico</a></li>
                    </ul>
                </li>
                <% } %>

                <% if (user.ControleAcesso("configuracoes", "principal")) { %>
                <li>
                    <a href="#"><span class="nav-label">Configura&ccedil;&otilde;es</span><span class="fa arrow"></span></a>
                    <ul class="nav nav-second-level collapse" aria-expanded="false">
                        <% if (user.ControleAcesso("criar", "usuarios")) { %><li><a href="<%= ResolveUrl("~/Usuarios/Index/") %>">Usu&aacute;rios</a></li><% } %>
                        <% if (user.ControleAcesso("criar", "filiais") && BLL.Usuarios.GetFilialIDMaster() == 0) { %><li><a href="<%= ResolveUrl("~/Filiais/Index/") %>">Filiais</a></li><% } %>
                        <% if (user.ControleAcesso("index", "Configuracoes")) { %><li><a href="<%= ResolveUrl("~/Configuracoes/Index/0/") %>">Vari&aacute;veis do Sistema</a></li><% } %>
                        <% if (user.ControleAcesso("index", "Logs")) { %><li><a href="<%= ResolveUrl("~/Logs/Index/0/") %>">Logs do Sistema</a></li><% } %>
                    </ul>
                </li>
                <% } %>

                <li><a href="#" class="logoff"><span class="nav-label">Sair</span></a></li>
            </ul>
        </div>
    </aside>

    <!-- ============================================================ -->
    <!-- MAIN WRAPPER (replica estrutura do _FortunaLayout) -->
    <!-- ============================================================ -->
    <div id="wrapper">

        <!-- Small header / breadcrumb -->
        <div class="small-header transition animated fadeIn">
            <div class="hpanel">
                <div class="panel-body">
                    <div id="hbreadcrumb" class="pull-right">
                        <ol class="hbreadcrumb breadcrumb">
                            <li><a href="<%= ResolveUrl("~/Principal/Index") %>">Home</a></li>
                            <li><a href="#">Relat&oacute;rios</a></li>
                            <li class="active"><span>Ponto Eletr&ocirc;nico</span></li>
                        </ol>
                    </div>
                    <h2 class="font-light m-b-xs">Ponto Eletr&ocirc;nico</h2>
                </div>
            </div>
        </div>

        <p>&nbsp;</p>

        <!-- Conteúdo da página -->
        <div class="content">
            <div class="row">
                <div class="col-lg-12">
                    <div class="ponto-container">
                        <div class="ponto-header">
                            <div class="ponto-title">
                                <h2>Controle de Ponto <span>Visualiza&ccedil;&otilde;es Di&aacute;rias</span></h2>
                            </div>
                            <div class="header-actions">
                                <button class="btn-export btn-monitoramento" onclick="abrirMonitoramento()">
                                    <i class="fa fa-desktop"></i> Monitoramento
                                </button>
                            </div>
                        </div>

                        <div class="filters-section">
                            <div class="filter-group">
                                <label>Buscar</label>
                                <input type="text" id="inputBusca" class="filter-input" placeholder="Funcion&aacute;rio ou RE...">
                            </div>
                            <div class="filter-group">
                                <label>Data Inicial</label>
                                <input type="date" id="dataInicial" class="filter-input">
                            </div>
                            <div class="filter-group">
                                <label>Data Final</label>
                                <input type="date" id="dataFinal" class="filter-input">
                            </div>
                            <div class="filter-group">
                                <label>&nbsp;</label>
                                <button class="btn-filter" onclick="carregarRegistros()">
                                    <i class="fa fa-refresh"></i> Atualizar
                                </button>
                            </div>
                        </div>

                        <div class="ponto-table-container">
                            <table class="ponto-table">
                                <thead>
                                    <tr>
                                        <th>RE</th>
                                        <th>Funcion&aacute;rio</th>
                                        <th>Posto</th>
                                        <th>Entrada</th>
                                        <th>Almo&ccedil;o</th>
                                        <th>Volta</th>
                                        <th>Sa&iacute;da</th>
                                        <th>Tipo</th>
                                        <th style="width:80px">A&ccedil;&otilde;es</th>
                                    </tr>
                                </thead>
                                <tbody id="pontoTableBody">
                                    <tr>
                                        <td colspan="9" style="text-align:center; padding:40px;">
                                            <i class="fa fa-spinner fa-spin"></i> Carregando registros...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div id="pontoPagination" class="pagination-container"></div>
                    </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer class="footer">
            <span class="pull-right"><%= DateTime.Now.Year %> &copy; Powered By <a href="http://www.e-bee.com.br" target="_blank" style="color:#ff7518;font-weight:bold">E-Bee</a></span>
        </footer>
    </div>

    <!-- Modal de Monitoramento (Full Screen) -->
    <div class="modal fade modal-monitoramento" id="modalMonitoramento" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <button class="btn-close-mon" onclick="fecharMonitoramento()"><i class="fa fa-times"></i></button>
                
                <div class="mon-header">
                    <h1>Monitoramento em Tempo Real</h1>
                </div>

                <div class="mon-stats">
                    <div class="stat-card border-blue">
                        <label>Total Funcion&aacute;rios</label>
                        <div class="value" id="monTotal">0</div>
                    </div>
                    <div class="stat-card border-green">
                        <label>Presentes Agora</label>
                        <div class="value" id="monPresentes">0</div>
                    </div>
                    <div class="stat-card border-orange">
                        <label>Em Intervalo</label>
                        <div class="value" id="monIntervalo">0</div>
                    </div>
                </div>

                <div class="mon-body">
                    <div class="mon-table-card">
                        <div class="mon-table-title">
                            <h3>Controle de Ponto</h3>
                            <span>| Visualiza&ccedil;&otilde;es Di&aacute;rias</span>
                            <span class="mon-search-count" id="monSearchCount"></span>
                        </div>

                        <div class="mon-search-box">
                            <i class="fa fa-search"></i>
                            <input type="text" id="monSearchInput" placeholder="Buscar por funcionário, RE ou status..." oninput="filtrarMonitoramento(this.value)">
                        </div>
                        
                        <table class="mon-table">
                            <thead>
                                <tr>
                                    <th style="width:30%">Funcion&aacute;rio</th>
                                    <th>Entrada</th>
                                    <th>Almo&ccedil;o</th>
                                    <th>Volta</th>
                                    <th>Sa&iacute;da</th>
                                    <th style="text-align:center">Status</th>
                                </tr>
                            </thead>
                            <tbody id="monTableBody">
                                <!-- Preenchido via JS -->
                            </tbody>
                        <div id="monPagination" class="pagination-container" style="background:white; border-top:1px solid #f1f5f9; padding:15px; margin-top:0;"></div>
                    </div>
                </div>

                <div class="mon-footer">
                    <div id="monCount">Carregando registros...</div>
                    <div>PR&Oacute;XIMA ATUALIZA&Ccedil;&Atilde;O EM: <b id="monTimer">30S</b> &nbsp; • &nbsp; VERS&_VERSAO_SYSTEM_4.2.0</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal de Edição -->
    <div class="modal fade" id="modalEdicao" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content text-left">
                <div class="color-line"></div>
                <div class="modal-header text-center">
                    <h4 class="modal-title">Editar Controle de Ponto</h4>
                    <small class="font-bold">Altere as informa&ccedil;&otilde;es conforme necess&aacute;rio no banco de dados.</small>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="editId">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="form-group">
                                <label>RE</label>
                                <input type="text" id="editRE" class="form-control">
                            </div>
                        </div>
                        <div class="col-md-9">
                            <div class="form-group">
                                <label>Funcion&aacute;rio</label>
                                <input type="text" id="editNome" class="form-control">
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Posto de Trabalho</label>
                                <input type="text" id="editPosto" class="form-control">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Data do Registro</label>
                                <input type="date" id="editData" class="form-control">
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-3">
                            <div class="form-group">
                                <label>Entrada</label>
                                <input type="time" id="editEntrada" class="form-control">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group">
                                <label>Sa&iacute;da Almo&ccedil;o</label>
                                <input type="time" id="editAlmocoSaida" class="form-control">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group">
                                <label>Retorno Almo&ccedil;o</label>
                                <input type="time" id="editAlmocoRetorno" class="form-control">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group">
                                <label>Sa&iacute;da</label>
                                <input type="time" id="editSaida" class="form-control">
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Supervis&atilde;o</label>
                                <input type="text" id="editSupervisao" class="form-control">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Tipo de Registro</label>
                                <select id="editTipo" class="form-control">
                                    <option value="Aplicativo">Aplicativo</option>
                                    <option value="Gerencial">Gerencial</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Situa&ccedil;&atilde;o</label>
                                <select id="editSituacao" class="form-control">
                                    <option value="Normal">Normal</option>
                                    <option value="Falta">Falta</option>
                                    <option value="Atestado">Atestado</option>
                                    <option value="Ferias">F&eacute;rias</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Observa&ccedil;&otilde;es</label>
                                <input type="text" id="editObs" class="form-control">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Fechar</button>
                    <button type="button" class="btn btn-primary" onclick="salvarEdicao()">Salvar Altera&ccedil;&otilde;es</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal de Visualização -->
    <div class="modal fade" id="modalVisualizacao" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content text-left">
                <div class="color-line"></div>
                <div class="modal-header text-center">
                    <h4 class="modal-title">Informa&ccedil;&otilde;es do Ponto</h4>
                    <small class="font-bold">Detalhes completos do registro selecionado (Somente Leitura).</small>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="form-group">
                                <label>RE</label>
                                <input type="text" id="viewRE" class="form-control" readonly>
                            </div>
                        </div>
                        <div class="col-md-9">
                            <div class="form-group">
                                <label>Funcion&aacute;rio</label>
                                <input type="text" id="viewNome" class="form-control" readonly>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Posto de Trabalho</label>
                                <input type="text" id="viewPosto" class="form-control" readonly>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Data do Registro</label>
                                <input type="text" id="viewData" class="form-control" readonly>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-3">
                            <div class="form-group">
                                <label>Entrada</label>
                                <input type="text" id="viewEntrada" class="form-control" readonly>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group">
                                <label>Sa&iacute;da Almo&ccedil;o</label>
                                <input type="text" id="viewAlmocoSaida" class="form-control" readonly>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group">
                                <label>Retorno Almo&ccedil;o</label>
                                <input type="text" id="viewAlmocoRetorno" class="form-control" readonly>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group">
                                <label>Sa&iacute;da</label>
                                <input type="text" id="viewSaida" class="form-control" readonly>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Supervis&atilde;o</label>
                                <input type="text" id="viewSupervisao" class="form-control" readonly>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Tipo de Registro</label>
                                <input type="text" id="viewTipo" class="form-control" readonly>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Situa&ccedil;&atilde;o</label>
                                <input type="text" id="viewSituacao" class="form-control" readonly>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Observa&ccedil;&otilde;es</label>
                                <input type="text" id="viewObs" class="form-control" readonly>
                            </div>
                        </div>
                    </div>
                    <!-- Horário Contratual de Referência -->
                    <div class="row" style="margin-top:15px; border-top:1px solid #eee; padding-top:15px;">
                        <div class="col-md-12">
                            <label style="color:#059669; font-weight:700;">Hor&aacute;rio Contratual (Refer&ecirc;ncia)</label>
                            <div class="row">
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label>Prev. Entrada</label>
                                        <input type="text" id="prevEnt" class="form-control" readonly style="background-color:#f0fdf4; border-color:#bbf7d0;">
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label>Prev. Almo&ccedil;o</label>
                                        <input type="text" id="prevAS" class="form-control" readonly style="background-color:#f0fdf4; border-color:#bbf7d0;">
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label>Ret. Almo&ccedil;o</label>
                                        <input type="text" id="prevAR" class="form-control" readonly style="background-color:#f0fdf4; border-color:#bbf7d0;">
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label>Prev. Sa&iacute;da</label>
                                        <input type="text" id="prevSai" class="form-control" readonly style="background-color:#f0fdf4; border-color:#bbf7d0;">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Total de Horas Trabalhadas -->
                    <div class="row" style="margin-top:15px; border-top:1px solid #eee; padding-top:15px;">
                        <div class="col-md-12">
                            <div class="form-group">
                                <label style="color:#2563eb; font-weight:700;">Total de Horas Trabalhadas (Efetivo)</label>
                                <input type="text" id="viewTotalTrabalhado" class="form-control" readonly style="background-color:#eff6ff; border-color:#bfdbfe; font-weight:bold; color:#1e40af;">
                            </div>
                        </div>
                    </div>
                    <!-- Seção de Observações Automáticas de Pontualidade -->
                    <div class="row" id="viewObsAutoContainer" style="display:none; margin-top:15px;">
                        <div class="col-md-12">
                            <label style="color:#2563eb; font-weight:700;">Observa&ccedil;&otilde;es de Pontualidade</label>
                            <div id="viewObsAuto" style="padding:15px; background:#f0f7ff; border:1px solid #d0e5ff; border-radius:8px; color:#1e40af; font-size:13px; line-height:1.6;">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Fechar</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts Fortuna -->
    <script src='<%= ResolveUrl("~/Assets/_fortuna/vendor/jquery/dist/jquery.min.js") %>'></script>
    <script src='<%= ResolveUrl("~/Assets/_fortuna/vendor/bootstrap/dist/js/bootstrap.min.js") %>'></script>
    <script src='<%= ResolveUrl("~/Assets/_fortuna/vendor/slimScroll/jquery.slimscroll.min.js") %>'></script>
    <script src='<%= ResolveUrl("~/Assets/_fortuna/vendor/metisMenu/dist/metisMenu.min.js") %>'></script>
    <script src='<%= ResolveUrl("~/Assets/_fortuna/vendor/iCheck/icheck.min.js") %>'></script>
    <script src='<%= ResolveUrl("~/Assets/_fortuna/vendor/sparkline/index.js") %>'></script>
    <script src='<%= ResolveUrl("~/Assets/_fortuna/scripts/homer.js") %>'></script>

    <script>
        // Logoff com confirmação
        $(".logoff").click(function () {
            if (confirm("Deseja realmente sair do sistema?")) {
                window.location = '<%= ResolveUrl("~/Home/Logoff/" + empresaId) %>';
            }
        });

        // ---- Tabela de Ponto Eletrônico ----
        const API_URL = '<%= ResolveUrl("~/Handlers/PontoHandler_vFinal.ashx") %>';
        let registrosAtuais = [];
        let monRegistros = [];
        let pontoPage = 1;
        let monPage = 1;
        const pageSize = 20;

        async function carregarRegistros() {
            const tbody = document.getElementById('pontoTableBody');
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;"><i class="fa fa-spinner fa-spin"></i> Carregando...</td></tr>';
            try {
                const busca       = document.getElementById('inputBusca').value  || '';
                const dataInicial = document.getElementById('dataInicial').value  || '';
                const dataFinal   = document.getElementById('dataFinal').value    || '';
                const params      = new URLSearchParams({ busca, dataInicial, dataFinal });
                const response    = await fetch(`${API_URL}?${params}`);
                if (!response.ok) throw new Error('Falha na API');
                pontoPage = 1; // Resetar para página 1 em nova busca
                renderizarTabela(await response.json());
            } catch (e) {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:red;padding:20px;">Erro ao carregar dados da API</td></tr>';
            }
        }

        function renderizarTabela(registros) {
            registrosAtuais = registros;
            const tbody = document.getElementById('pontoTableBody');
            tbody.innerHTML = '';
            
            if (!registros || !registros.length) {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;">Nenhum registro encontrado para este per&iacute;odo</td></tr>';
                document.getElementById('pontoPagination').innerHTML = '';
                return;
            }

            // Paginação Ponto
            const total = registros.length;
            const start = (pontoPage - 1) * pageSize;
            const end = start + pageSize;
            const paginados = registros.slice(start, end);

            paginados.forEach(reg => {
                let cls = 'status-entrada';
                if (reg.Situacao === 'Falta') { cls = 'status-falta'; reg.Entrada = 'FALTA'; }
                const row = document.createElement('tr');
                row.innerHTML = 
                    '<td>' + (reg.RE || '') + '</td>' +
                    '<td style="font-weight:600">' + reg.NomeFuncionario + '</td>' +
                    '<td>' + (reg.PostoTrabalho || '') + '</td>' +
                    '<td class="' + cls + '">' + (reg.Entrada || '--:--') + '</td>' +
                    '<td>' + (reg.AlmocoSaida || '--:--') + '</td>' +
                    '<td>' + (reg.AlmocoRetorno || '--:--') + '</td>' +
                    '<td>' + (reg.Saida || '--:--') + '</td>' +
                    '<td>' + (reg.TipoRegistro || '') + '</td>' +
                    '<td>' +
                        '<div class="action-icons">' +
                            '<i class="fa fa-eye"   style="color:#64748b; cursor:pointer;" title="Visualizar" onclick="abrirModalVisualizacao(\'' + reg.Id + '\')"></i>' +
                            '<i class="fa fa-edit"  style="color:#3b82f6; cursor:pointer;" title="Editar" onclick="abrirModalEdicao(\'' + reg.Id + '\')"></i>' +
                            '<i class="fa fa-trash" style="color:#ef4444; cursor:pointer;" title="Excluir" onclick="excluirRegistro(\'' + reg.Id + '\')"></i>' +
                        '</div>' +
                    '</td>';
                tbody.appendChild(row);
            });

            renderPaginationUI('pontoPagination', total, pontoPage, 'irParaPaginaPonto');
        }

        function irParaPaginaPonto(p) {
            pontoPage = p;
            renderizarTabela(registrosAtuais);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // ---- Helpers Globais ----
        const safeSet = (fieldId, val) => {
            const el = document.getElementById(fieldId);
            if (el) el.value = val || '';
            else console.warn("Elemento não encontrado:", fieldId);
        };

        const formatTime = (t) => {
            if (!t || typeof t !== 'string' || t === '--:--' || t.toLowerCase() === 'falta') return '';
            const match = t.trim().match(/(\d{1,2}):(\d{1,2})/);
            if (match) return match[1].padStart(2, '0') + ':' + match[2].padStart(2, '0');
            return '';
        };

        const parseTime = (t) => {
            if (!t || typeof t !== 'string' || t === '--:--' || t.toLowerCase() === 'falta') return null;
            if (t.includes(' ')) return t.split(' ')[1].substring(0, 5);
            return t.trim().substring(0, 5);
        };

        const toMin = (t) => {
            if (!t || typeof t !== 'string' || !t.includes(':')) return -1;
            const parts = t.split(':');
            return (parseInt(parts[0]) * 60) + (parseInt(parts[1]) || 0);
        };

        const formatDiff = (m) => {
            const abs = Math.abs(m);
            const h = Math.floor(abs / 60);
            const mins = abs % 60;
            return (h > 0 ? h + 'h ' : '') + mins + 'min';
        };

        function abrirModalEdicao(id) {
            console.log("Chamando abrirModalEdicao para ID:", id);
            const $modal = $('#modalEdicao');
            console.log("Elemento Modal Edição encontrado:", $modal.length);
            
            // Forçar visibilidade se o Bootstrap falhar
            $modal.removeClass('fade').css({'display': 'block', 'opacity': '1', 'visibility': 'visible'});
            
            try {
                const reg = registrosAtuais.find(r => r.Id == id);
                if (!reg) {
                    console.error("Registro não encontrado para ID:", id);
                    return;
                }

                safeSet('editId', reg.Id);
                safeSet('editRE', reg.RE);
                safeSet('editNome', reg.NomeFuncionario);
                safeSet('editPosto', reg.PostoTrabalho);
                
                let dateVal = '';
                if (reg.DataRegistro && typeof reg.DataRegistro === 'string') {
                    const onlyDate = reg.DataRegistro.split(' ')[0];
                    if (onlyDate.includes('-')) dateVal = onlyDate;
                    else if (onlyDate.includes('/')) {
                        const pts = onlyDate.split('/');
                        if (pts.length === 3) dateVal = `${pts[2]}-${pts[1]}-${pts[0]}`;
                    }
                }
                safeSet('editData', dateVal);

                safeSet('editEntrada', formatTime(reg.Entrada));
                safeSet('editAlmocoSaida', formatTime(reg.AlmocoSaida));
                safeSet('editAlmocoRetorno', formatTime(reg.AlmocoRetorno));
                safeSet('editSaida', formatTime(reg.Saida));
                
                safeSet('editSupervisao', reg.Supervisao);
                safeSet('editTipo', reg.TipoRegistro || 'Aplicativo');
                safeSet('editObs', reg.Observacoes);
                safeSet('editSituacao', reg.Situacao || 'Normal');

                $('#modalEdicao').modal('show');
            } catch (err) {
                console.error("Erro no processamento do modal de edição:", err);
                alert("Erro ao carregar dados para edição: " + err.message);
            }
        }

        function abrirModalVisualizacao(id) {
            console.log("Chamando abrirModalVisualizacao para ID:", id);
            const $modal = $('#modalVisualizacao');
            console.log("Elemento Modal Visualização encontrado:", $modal.length);
            
            // Forçar visibilidade se o Bootstrap falhar
            $modal.removeClass('fade').css({'display': 'block', 'opacity': '1', 'visibility': 'visible'});
            
            try {
                const reg = registrosAtuais.find(r => r.Id == id);
                if (!reg) {
                    console.error("Registro não encontrado para ID:", id);
                    return;
                }

                safeSet('viewRE', reg.RE);
                safeSet('viewNome', reg.NomeFuncionario);
                safeSet('viewPosto', reg.PostoTrabalho);
                safeSet('viewData', reg.DataRegistro);
                safeSet('viewEntrada', reg.Entrada || '--:--');
                safeSet('viewAlmocoSaida', reg.AlmocoSaida || '--:--');
                safeSet('viewAlmocoRetorno', reg.AlmocoRetorno || '--:--');
                safeSet('viewSaida', reg.Saida || '--:--');
                safeSet('viewSupervisao', reg.Supervisao);
                safeSet('viewTipo', reg.TipoRegistro);
                safeSet('viewSituacao', reg.Situacao);
                safeSet('viewObs', reg.Observacoes);

                const obsContainer = document.getElementById('viewObsAutoContainer');
                const obsDiv = document.getElementById('viewObsAuto');
                let msgs = [];

                const tEnt = parseTime(reg.Entrada);
                const tAS  = parseTime(reg.AlmocoSaida);
                const tAR  = parseTime(reg.AlmocoRetorno);
                const tSai = parseTime(reg.Saida);

                const pEnt = parseTime(reg.PrevEntrada);
                const pSai = parseTime(reg.PrevSaida);
                const pAS  = parseTime(reg.PrevAlmocoIni);
                const pAR  = parseTime(reg.PrevAlmocoFim);

                safeSet('prevEnt', pEnt || '--:--');
                safeSet('prevAS', pAS || '--:--');
                safeSet('prevAR', pAR || '--:--');
                safeSet('prevSai', pSai || '--:--');

                // ---- Seção de Ocorrências ----
                const ocorrenciasContainer = document.getElementById('viewOcorrenciasContainer') || (() => {
                    const div = document.createElement('div');
                    div.id = 'viewOcorrenciasContainer';
                    div.className = 'row';
                    div.style.marginTop = '15px'; div.style.borderTop = '1px solid #eee'; div.style.paddingTop = '15px';
                    const parent = document.getElementById('viewObsAutoContainer').parentNode;
                    if (parent) parent.appendChild(div);
                    return div;
                })();

                if (reg.Ocorrencias && reg.Ocorrencias.length > 0) {
                    ocorrenciasContainer.style.display = 'block';
                    let htmlOcor = '<div class="col-md-12"><label style="color:#ef4444; font-weight:700;">Ocorrências no Dia</label>';
                    reg.Ocorrencias.forEach(o => {
                        htmlOcor += `
                            <div style="padding:15px; background:#fff5f5; border:1px solid #feb2b2; border-radius:8px; margin-bottom:10px; font-size:13px;">
                                <div class="row">
                                    <div class="col-md-4"><b>Id:</b> ${o.Id}</div>
                                    <div class="col-md-4"><b>Situação:</b> ${o.Situacao}</div>
                                    <div class="col-md-4"><b>Tipo:</b> ${o.Tipo}</div>
                                </div>
                                <div style="margin-top:8px; padding-top:8px; border-top:1px dashed #feb2b2;">
                                    <b>Descrição:</b><br/>${o.Descricao}
                                </div>
                            </div>`;
                    });
                    htmlOcor += '</div>';
                    ocorrenciasContainer.innerHTML = htmlOcor;
                } else {
                    ocorrenciasContainer.style.display = 'none';
                }

                if (tEnt && pEnt) {
                    const diff = toMin(tEnt) - toMin(pEnt);
                    if (diff > 0) msgs.push('<b>Atraso na Entrada:</b> ' + formatDiff(diff));
                    else if (diff < 0) msgs.push('<b>Entrada Antecipada:</b> ' + formatDiff(diff));
                }

                if (tAS && pAS) {
                    const diff = toMin(tAS) - toMin(pAS);
                    if (diff > 0) msgs.push('<b>Intervalo iniciado com atraso:</b> ' + formatDiff(diff));
                }

                if (tAS && tAR) {
                    const duracao = toMin(tAR) - toMin(tAS);
                    if (duracao > 1) {
                         if (duracao < 60) msgs.push('<span style="color:#ef4444"><b>Alerta:</b> Intervalo curto (' + formatDiff(duracao) + ').</span>');
                         else msgs.push('<b>Duração do Intervalo:</b> ' + formatDiff(duracao));
                    }
                }

                if (tSai && pSai) {
                    const diff = toMin(tSai) - toMin(pSai);
                    if (diff < 0) msgs.push('<b>Saída antecipada:</b> ' + formatDiff(diff));
                    else if (diff > 0) msgs.push('<b>Horas excedentes:</b> ' + formatDiff(diff));
                }

                let totalMin = 0;
                if (tEnt && tSai) {
                    if (tAS && tAR) totalMin = (toMin(tAS) - toMin(tEnt)) + (toMin(tSai) - toMin(tAR));
                    else totalMin = (toMin(tSai) - toMin(tEnt));
                }

                safeSet('viewTotalTrabalhado', totalMin > 0 ? formatDiff(totalMin) : '--:--');

                if (msgs.length > 0) {
                    obsDiv.innerHTML = msgs.join('<br>');
                    obsContainer.style.display = 'block';
                } else {
                    obsContainer.style.display = 'none';
                }

                $('#modalVisualizacao').modal('show');
            } catch (err) {
                console.error("Erro no processamento do modal de visualização:", err);
                alert("Erro ao carregar dados para visualização: " + err.message);
            }
        }

        async function salvarEdicao() {
            const id = document.getElementById('editId').value;
            const body = new FormData();
            body.append('acao', 'editar');
            body.append('id', id);
            body.append('re', document.getElementById('editRE').value);
            body.append('nome', document.getElementById('editNome').value);
            body.append('posto', document.getElementById('editPosto').value);
            body.append('data', document.getElementById('editData').value);
            body.append('entrada', document.getElementById('editEntrada').value);
            body.append('almocoSaida', document.getElementById('editAlmocoSaida').value);
            body.append('almocoRetorno', document.getElementById('editAlmocoRetorno').value);
            body.append('saida', document.getElementById('editSaida').value);
            body.append('supervisao', document.getElementById('editSupervisao').value);
            body.append('tipo', document.getElementById('editTipo').value);
            body.append('obs', document.getElementById('editObs').value);
            body.append('situacao', document.getElementById('editSituacao').value);

            try {
                const response = await fetch(API_URL, { method: 'POST', body });
                const text = await response.text();
                let result;
                try {
                    result = JSON.parse(text);
                } catch (jsonErr) {
                    alert('Erro no servidor (Resposta inv\u00E1lida): ' + text.substring(0, 100));
                    return;
                }

                if (result.status === 'ok') {
                    $('#modalEdicao').modal('hide');
                    carregarRegistros();
                } else {
                    alert(result.message || 'Erro ao salvar');
                }
            } catch (e) {
                alert('Erro na conex\u00E3o: ' + e.message);
            }
        }

        async function excluirRegistro(id) {
            if (!confirm('Deseja realmente excluir este registro?')) return;
            try { await fetch(`${API_URL}?id=${id}&acao=excluir`); carregarRegistros(); }
            catch (e) { alert('Erro ao excluir'); }
        }

        function exportPDF()   { alert('Fun&ccedil;&atilde;o de PDF em desenvolvimento'); }
        function exportExcel() { alert('Fun&ccedil;&atilde;o de Excel em desenvolvimento'); }

        let monTimerInterval;
        let monRefreshInterval;

        function fecharMonitoramento() {
            $('#modalMonitoramento').modal('hide');
            clearInterval(monRefreshInterval);
            clearInterval(monTimerInterval);
        }

        function filtrarMonitoramento(termo) {
            var t = (termo || '').toLowerCase().trim();
            var rows = document.querySelectorAll('#monTableBody tr');
            var visiveis = 0;
            rows.forEach(function(row) {
                var txt = row.innerText.toLowerCase();
                if (!t || txt.indexOf(t) !== -1) {
                    row.style.display = '';
                    visiveis++;
                } else {
                    row.style.display = 'none';
                }
            });
            var countEl = document.getElementById('monSearchCount');
            if (countEl) {
                countEl.innerText = t ? (visiveis + ' de ' + rows.length + ' registros') : '';
            }
        }

        function iniciarMonTimer() {
            let tempo = 30;
            const el = document.getElementById('monTimer');
            if (!el) return;
            clearInterval(monTimerInterval);
            monTimerInterval = setInterval(() => {
                tempo--;
                if (tempo <= 0) tempo = 30;
                el.innerText = tempo + 'S';
            }, 1000);
        }

        function renderPaginationUI(containerId, totalItems, currentPage, onPageChange) {
            const container = document.getElementById(containerId);
            const totalPages = Math.ceil(totalItems / pageSize) || 1;
            const startDisplay = totalItems > 0 ? ((currentPage - 1) * pageSize) + 1 : 0;
            const endDisplay = Math.min(currentPage * pageSize, totalItems);

            let html = `
                <div class="pagination-info">Mostrando <b>${startDisplay}-${endDisplay}</b> de <b>${totalItems}</b> registros</div>
                <div class="pagination-controls">
                    <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="${onPageChange}(${currentPage - 1})"><i class="fa fa-chevron-left"></i></button>
            `;

            let pages = [];
            if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
                if (currentPage <= 4) pages = [1, 2, 3, 4, 5, '...', totalPages];
                else if (currentPage >= totalPages - 3) pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                else pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
            }

            pages.forEach(p => {
                if (p === '...') html += `<span class="page-dots">...</span>`;
                else html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" onclick="${onPageChange}(${p})">${p}</button>`;
            });

            html += `
                    <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="${onPageChange}(${currentPage + 1})"><i class="fa fa-chevron-right"></i></button>
                </div>
            `;
            container.innerHTML = html;
        }

        function irParaPaginaMon(p) {
            monPage = p;
            renderMonitoramentoTable();
        }

        function abrirMonitoramento() {
            // Limpar busca ao abrir
            var si = document.getElementById('monSearchInput');
            if (si) { si.value = ''; }
            var sc = document.getElementById('monSearchCount');
            if (sc) { sc.innerText = ''; }

            $('#modalMonitoramento').modal('show');
            monPage = 1;
            atualizarMonitoramento();
            
            clearInterval(monRefreshInterval);
            monRefreshInterval = setInterval(atualizarMonitoramento, 30000);
            
            iniciarMonTimer();
        }

        function renderMonitoramentoTable() {
            const tbody = document.getElementById('monTableBody');
            const total = monRegistros.length;
            
            // Proteção: Se a página atual não tem registros (ex: após filtro/refresh), volta para o início
            if (total === 0) { monPage = 1; }
            const totalPages = Math.ceil(total / pageSize) || 1;
            if (monPage > totalPages) monPage = 1;

            const start = (monPage - 1) * pageSize;
            const end = start + pageSize;
            const paginados = monRegistros.slice(start, end);

            tbody.innerHTML = paginados.map(r => `
                <tr>
                    <td>
                        <span class="mon-name">${r.Nome}</span>
                        <span class="mon-sub">${r.RE} | ${r.Posto || 'Sem Posto'}</span>
                    </td>
                    <td class="mon-time">${r.Entrada || '--:--'}</td>
                    <td class="mon-time">${r.AlmocoSaida || '--:--'}</td>
                    <td class="mon-time">${r.AlmocoRetorno || '--:--'}</td>
                    <td class="mon-time">${r.Saida || '--:--'}</td>
                    <td style="text-align:center">
                        <span class="badge-status badge-${r.Status.toLowerCase().replace(' ', '-')}">${r.Status}</span>
                    </td>
                </tr>
            `).join('');

            renderPaginationUI('monPagination', total, monPage, 'irParaPaginaMon');
        }

        async function atualizarMonitoramento() {
            try {
                const response = await fetch(`${API_URL}?acao=monitoramento`);
                const json = await response.json();
                
                document.getElementById('monTotal').innerText = json.total;
                document.getElementById('monPresentes').innerText = json.presentes;
                document.getElementById('monIntervalo').innerText = json.emIntervalo;
                document.getElementById('monCount').innerText = `Total de ${json.total} registros ativos monitorados`;
                
                monRegistros = json.data;
                renderMonitoramentoTable();
                
                iniciarMonTimer();
            } catch (e) {
                console.error("Erro ao atualizar monitoramento:", e);
            }
        }

        document.getElementById('inputBusca').addEventListener('keypress', e => { if (e.key === 'Enter') carregarRegistros(); });

        // Override Bootstrap scrollbar behavior to prevent layout shift
        if ($.fn.modal) {
            $.fn.modal.Constructor.prototype.setScrollbar = function () {};
            $.fn.modal.Constructor.prototype.resetScrollbar = function () {};
        }

        document.addEventListener('DOMContentLoaded', () => {
            const today = new Date();
            const d = today.toLocaleString('sv-SE').split(' ')[0]; // YYYY-MM-DD local
            document.getElementById('dataInicial').value = d;
            document.getElementById('dataFinal').value   = d;
            try { $('#side-menu').metisMenu(); } catch(e) {}
            setTimeout(carregarRegistros, 500);
        });
    </script>
</body>
</html>
