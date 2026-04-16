(function () {
    window.onload = init;
})();

var portaria = 0;
var limpeza = 0;
var zeladoria = 0;
var supervisao = 0;
var atendimentooperadores = 0;
var atendimentotecninco = 0;
var aplicativo = 0;
var servicoportariaremota = 0;

function init() {
    var token = location.search.substring(1, location.search.length);
     
    if(!token)
        return false;

    requestAPI(token);    
}

function requestAPI(token) {
    return Promise.all([  
        $.ajax({
            type: "GET",
            url:  UrlWsRequisicao + 'BuscaClientPorTokenPesquisa/?token=' + token,
            //url: 'http://localhost:5344/ApiIntegracao/BuscaClientPorTokenPesquisa/?token=' + token,
            data: '{}',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            async: true
        }).then((res) => {
            montaDadosPesquisa(res[0]);
            montaDadosCliente(res[1]);
        })      
    ]);
}

function montaDadosCliente(dadosCliente) {
    $('#condominio').val(dadosCliente.PostoDeServicoNome);
    $('#endereco').val(dadosCliente.PostoDeServicoEndereco + ", nro " + dadosCliente.PostoDeServicoNumero + " / " + dadosCliente.PostoDeServicoBairro);
    $('#cidade').val(dadosCliente.PostoDeServicoCidade + " / " + dadosCliente.PostoDeServicoEstado);
    window.sessionStorage.setItem("PostoDeServicoId", dadosCliente.PostoDeServicoId);
    
}

function montaDadosPesquisa(dadosPesquisa) {
    $('#email').val(dadosPesquisa.Destinatario);
    window.sessionStorage.setItem("idpesquisa", dadosPesquisa.IdPesquisa);
    window.sessionStorage.setItem("idcontato", dadosPesquisa.idcontato);
    window.sessionStorage.setItem("Respondida", dadosPesquisa.Respondida);
    
    portaria = dadosPesquisa.Pergunta1;
    limpeza = dadosPesquisa.Pergunta2;
    zeladoria = dadosPesquisa.Pergunta3;
    supervisao = dadosPesquisa.Pergunta4;
    atendimentooperadores = dadosPesquisa.Pergunta5;
    atendimentotecnico = dadosPesquisa.Pergunta6;
    aplicativo = dadosPesquisa.Pergunta7;
    servicoportariaremota = dadosPesquisa.Pergunta8;



    if (portaria == 0) {
        $('#portaria').remove();
        $('#portariahr').remove();
    }

    if (limpeza == 0) {
        $('#limpeza').remove();
        $('#limpezahr').remove();
    }

    if (zeladoria == 0) {
        $('#zeladoria').remove();
        $('#zeladoriahr').remove();
    }

    if (supervisao == 0) {
        $('#supervisao').remove();
        $('#supervisaohr').remove();
    }

    if (atendimentooperadores == 0) {
        $('#atendimentooperadores').remove();
        $('#atendimentooperadoreshr').remove();
    }

    if (atendimentotecnico == 0) {
        $('#atendimentotecnico').remove();
        $('#atendimentotecnicohr').remove();
    }

    if (aplicativo == 0) {
        $('#aplicativo').remove();
        $('#aplicativohr').remove();
    }

    if (servicoportariaremota == 0) {
        $('#servicoportariaremota').remove();
        $('#servicoportariaremotahr').remove();
    }

    var concluida = dadosPesquisa.Concluida;

    if (concluida === "S") {
        $("#upload-button").attr("disabled", true);
        $('#obs').val(dadosPesquisa.Observacao);
        alert("Pesquisa já respondida.");
    }

    



}

function enviarFileFromStream(){

    var email = $('#email').val();
    var pergunta1 = "0";
    var pergunta2 = "0";
    var pergunta3 = "0";
    var pergunta4 = "0";

    var pergunta5 = "0";
    var pergunta6 = "0";
    var pergunta7 = "0";
    var pergunta8 = "0";

    if (portaria == 1) {
        pergunta1 = $("input[name='portaria']:checked").val();
    }

    if (limpeza == 1) {
        pergunta2 = $("input[name='limpeza']:checked").val();
    }

    if (zeladoria == 1) {
        pergunta3 = $("input[name='zeladoria']:checked").val();
    }

    if (supervisao == 1) {
        pergunta4 = $("input[name='supervisao']:checked").val();
    }

    if (atendimentooperadores == 1) {
        pergunta5 = $("input[name='operadores']:checked").val();
    }

    if (atendimentotecnico == 1) {
        pergunta6 = $("input[name='tecnico']:checked").val();
    }

    if (aplicativo == 1) {
        pergunta7 = $("input[name='aplicativo']:checked").val();
    }

    if (servicoportariaremota == 1) {
        pergunta8 = $("input[name='remota']:checked").val();
    }


    var obs = $('#obs').val();

    var idpesquisa = window.sessionStorage.getItem("idpesquisa");
    var idcontato = window.sessionStorage.getItem("idcontato");
    var idcliente = window.sessionStorage.getItem("PostoDeServicoId");
     
    $.ajax({
        type: "POST",
        //url: 'http://localhost:5344/ApiIntegracao/AtualizarPesquisaClientes/?idcliente=' + idcliente + '&idpesquisa=' + idpesquisa + '&idcontato=' + idcontato + '&pergunta1=' + Number(pergunta1) + '&pergunta2=' + Number(pergunta2) + '&pergunta3=' + Number(pergunta3) + '&pergunta4=' + Number(pergunta4) + '&obs=' + obs + '&pergunta5=' + Number(pergunta5) + '&pergunta6=' + Number(pergunta6) + '&pergunta7=' + Number(pergunta7) + '&pergunta8=' + Number(pergunta8) ,       
        url: UrlWsRequisicao + 'AtualizarPesquisaClientes/?idcliente=' + Number(idcliente) + '&idpesquisa=' + Number(idpesquisa) + '&idcontato=' + Number(idcontato) + '&pergunta1=' + Number(pergunta1) + '&pergunta2=' + Number(pergunta2) + '&pergunta3=' + Number(pergunta3) + '&pergunta4=' + Number(pergunta4) + '&obs=' + obs + '&pergunta5=' + Number(pergunta5) + '&pergunta6=' + Number(pergunta6) + '&pergunta7=' + Number(pergunta7) + '&pergunta8=' + Number(pergunta8) ,       
        data: JSON.stringify(),
        cache: false,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        beforeSend: function () {
            $.LoadingOverlay("show");
        },
        complete: function () {
            $.LoadingOverlay("hide");
        },
        success: function (resposta) {
            alert(resposta);            
        },
        error: function (data) {
            alert(resposta);
        }
    });


}

$(document).ready(function () {
    $('input:radio[name=portaria]').change(function () {
        if (this.value == '1') {
            $("#pergunta1").attr("src", "pessimo.png");
        }

        if (this.value == '2') {
            $("#pergunta1").attr("src", "ruim.png");
        }

        if (this.value == '3') {
            $("#pergunta1").attr("src", "regular.png");
        }

        if (this.value == '4') {
            $("#pergunta1").attr("src", "bom.png");
        }

        if (this.value == '5') {
            $("#pergunta1").attr("src", "excelente.png");
        }

    });

    $('input:radio[name=limpeza]').change(function () {
        if (this.value == '1') {
            $("#pergunta2").attr("src", "pessimo.png");
        }

        if (this.value == '2') {
            $("#pergunta2").attr("src", "ruim.png");
        }

        if (this.value == '3') {
            $("#pergunta2").attr("src", "regular.png");
        }

        if (this.value == '4') {
            $("#pergunta2").attr("src", "bom.png");
        }

        if (this.value == '5') {
            $("#pergunta2").attr("src", "excelente.png");
        }

    });

    $('input:radio[name=zeladoria]').change(function () {
        if (this.value == '1') {
            $("#pergunta3").attr("src", "pessimo.png");
        }

        if (this.value == '2') {
            $("#pergunta3").attr("src", "ruim.png");
        }

        if (this.value == '3') {
            $("#pergunta3").attr("src", "regular.png");
        }

        if (this.value == '4') {
            $("#pergunta3").attr("src", "bom.png");
        }

        if (this.value == '5') {
            $("#pergunta3").attr("src", "excelente.png");
        }

    });

    $('input:radio[name=supervisao]').change(function () {
        if (this.value == '1') {
            $("#pergunta4").attr("src", "pessimo.png");
        }

        if (this.value == '2') {
            $("#pergunta4").attr("src", "ruim.png");
        }

        if (this.value == '3') {
            $("#pergunta4").attr("src", "regular.png");
        }

        if (this.value == '4') {
            $("#pergunta4").attr("src", "bom.png");
        }

        if (this.value == '5') {
            $("#pergunta4").attr("src", "excelente.png");
        }

    });
    
    $('input:radio[name=operadores]').change(function () {
        if (this.value == '1') {
            $("#pergunta5").attr("src", "pessimo.png");
        }

        if (this.value == '2') {
            $("#pergunta5").attr("src", "ruim.png");
        }

        if (this.value == '3') {
            $("#pergunta5").attr("src", "regular.png");
        }

        if (this.value == '4') {
            $("#pergunta5").attr("src", "bom.png");
        }

        if (this.value == '5') {
            $("#pergunta5").attr("src", "excelente.png");
        }
    });
    
    $('input:radio[name=tecnico]').change(function () {
        if (this.value == '1') {
            $("#pergunta6").attr("src", "pessimo.png");
        }

        if (this.value == '2') {
            $("#pergunta6").attr("src", "ruim.png");
        }

        if (this.value == '3') {
            $("#pergunta6").attr("src", "regular.png");
        }

        if (this.value == '4') {
            $("#pergunta6").attr("src", "bom.png");
        }

        if (this.value == '5') {
            $("#pergunta6").attr("src", "excelente.png");
        }
    });
    
    $('input:radio[name=aplicativo]').change(function () {
        if (this.value == '1') {
            $("#pergunta7").attr("src", "pessimo.png");
        }

        if (this.value == '2') {
            $("#pergunta7").attr("src", "ruim.png");
        }

        if (this.value == '3') {
            $("#pergunta7").attr("src", "regular.png");
        }

        if (this.value == '4') {
            $("#pergunta7").attr("src", "bom.png");
        }

        if (this.value == '5') {
            $("#pergunta7").attr("src", "excelente.png");
        }
    });
    
    $('input:radio[name=remota]').change(function () {
        if (this.value == '1') {
            $("#pergunta8").attr("src", "pessimo.png");
        }

        if (this.value == '2') {
            $("#pergunta8").attr("src", "ruim.png");
        }

        if (this.value == '3') {
            $("#pergunta8").attr("src", "regular.png");
        }

        if (this.value == '4') {
            $("#pergunta8").attr("src", "bom.png");
        }

        if (this.value == '5') {
            $("#pergunta8").attr("src", "excelente.png");
        }
    });
});