(function () {
    window.onload = init;
})();

function init() {
    CarregarGráfico(1);
    CarregarGráfico(2);
    CarregarGráfico(3);
    CarregarGráfico(4);
    CarregaComboCliente();
}

 
function CarregarGráfico(idpergunta) {
    
    $.ajax({
        type: "POST",
        url: UrlWsRequisicao + 'ObterRespostaPesquisa/?idpergunta=' + Number(idpergunta), 
        //url: 'http://localhost:52327/ApiIntegracao/ObterRespostaPesquisa/?idpergunta=' + Number(idpergunta),
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
             
            switch (Number(idpergunta)) {
                case 1:
                    CarregarGrafico1(resposta);
                    break;
                case 2:
                    CarregarGrafico2(resposta);
                    break;
                case 3:
                    CarregarGrafico3(resposta);
                    break;
                case 4:
                    CarregarGrafico4(resposta);
                    break;
            }
        },
        error: function (data) {
            alert(resposta);
        }
    });

}

function CarregarGrafico1(resposta) {
    google.load("visualization", "1", { packages: ["corechart"] });
    var retApi = [];
    retApi.push(['Pergunta 1', 'Quantidade']);
    resposta.forEach(item => {
        retApi.push([item.pergunta + ' ( ' + item.qtd + ' ) ', item.qtd])
    });

    var data = google.visualization.arrayToDataTable(
         retApi
    );

    var options = {
        title: 'Serviço de portaria ' ,//titulo do gráfico
        is3D: true // false para 2d e true para 3d o padrão é false
    };

    var chart = new google.visualization
    .PieChart(document.getElementById('chart_div'));
    chart.draw(data, options);
    //google.setOnLoadCallback(drawChart);
}

function CarregarGrafico2(resposta) {
    google.load("visualization", "1", { packages: ["corechart"] });
    var retApi = [];
    retApi.push(['Pergunta 2', 'Quantidade']);
    resposta.forEach(item => {
        retApi.push([item.pergunta + ' ( ' + item.qtd + ' ) ', item.qtd])
    });

    var data = google.visualization.arrayToDataTable(
         retApi
    );

    var options = {
        title: 'Serviço de limpeza' ,//titulo do gráfico
        is3D: true // false para 2d e true para 3d o padrão é false
    };

    var chart = new google.visualization
    .PieChart(document.getElementById('chart_div2'));
    chart.draw(data, options);
    //google.setOnLoadCallback(drawChart);
}

function CarregarGrafico3(resposta) {
    google.load("visualization", "1", { packages: ["corechart"] });
    var retApi = [];
    retApi.push(['Pergunta 3', 'Quantidade']);
    resposta.forEach(item => {
        retApi.push([item.pergunta + ' ( ' + item.qtd + ' ) ', item.qtd])
    });

    var data = google.visualization.arrayToDataTable(
         retApi
    );

    var options = {
        title: 'Serviço de zeladoria ',//titulo do gráfico
        is3D: true // false para 2d e true para 3d o padrão é false
    };

    var chart = new google.visualization
    .PieChart(document.getElementById('chart_div3'));
    chart.draw(data, options);
    //google.setOnLoadCallback(drawChart);
}

function CarregarGrafico4(resposta) {
    google.load("visualization", "1", { packages: ["corechart"] });
    var retApi = [];
    retApi.push(['Pergunta 4', 'Quantidade']);
    resposta.forEach(item => {
        retApi.push([item.pergunta + ' ( ' + item.qtd + ' ) ', item.qtd])
    });

    var data = google.visualization.arrayToDataTable(
         retApi
    );

    var options = {
        title: 'Serviço de supervisão' ,//titulo do gráfico
        is3D: true // false para 2d e true para 3d o padrão é false
    };

    var chart = new google.visualization
    .PieChart(document.getElementById('chart_div4'));
    chart.draw(data, options);
    //google.setOnLoadCallback(drawChart);
}
 

function AtualizarPesquisaPorPosto() {
    var idcliente = $("#cbCliente option:selected").val();
    
    if (Number(idcliente) !== 0) {

    

    $.ajax({
        type: "POST",
        url: UrlWsRequisicao + 'ObterRespostaPesquisaCliente/?idpergunta=1&idcliente=' + Number(idcliente),
        //url: 'http://localhost:52327/ApiIntegracao/ObterRespostaPesquisaCliente/?idpergunta=1&idcliente=' + Number(idcliente),
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
            CarregarGrafico1(resposta);
        },
        error: function (data) {
            alert(resposta);
        }
    });

    $.ajax({
        type: "POST",
        url: UrlWsRequisicao + 'ObterRespostaPesquisaCliente/?idpergunta=2&idcliente=' + Number(idcliente),
        //url: 'http://localhost:52327/ApiIntegracao/ObterRespostaPesquisaCliente/?idpergunta=2&idcliente=' + Number(idcliente),
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
            CarregarGrafico2(resposta);
        },
        error: function (data) {
            alert(resposta);
        }
    });

    $.ajax({
        type: "POST",
        url: UrlWsRequisicao + 'ObterRespostaPesquisaCliente/?idpergunta=3&idcliente=' + Number(idcliente),
        //url: 'http://localhost:52327/ApiIntegracao/ObterRespostaPesquisaCliente/?idpergunta=3&idcliente=' + Number(idcliente),
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
            CarregarGrafico3(resposta);
        },
        error: function (data) {
            alert(resposta);
        }
    });

    $.ajax({
        type: "POST",
        url: UrlWsRequisicao + 'ObterRespostaPesquisaCliente/?idpergunta=4&idcliente=' + Number(idcliente),
        //url: 'http://localhost:52327/ApiIntegracao/ObterRespostaPesquisaCliente/?idpergunta=4&idcliente=' + Number(idcliente),
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
            CarregarGrafico4(resposta);
        },
        error: function (data) {
            alert(resposta);
        }
    });
    }
}


function CarregaComboCliente() {

    $('#cbCliente')
    .find('option')
    .remove()
    .end();

    var dComboCliente = {};
    
    $.ajax({
        type: "POST",
        url: UrlWsRequisicao + 'ObterCliente',
        //url: "http://localhost:52327/ApiIntegracao/ObterCliente",
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
            dComboCliente = resposta;

            var cmb = '<option value="">Selecione um cliente </option>';

            $.each(dComboCliente, function (index, value) {
                cmb += '<option value="';
                cmb += value.idcliente;
                cmb += '">';
                cmb += value.posto;
                cmb += '</option>';
            });

            $('#cbCliente').append(cmb);
        },
        error: function (data) {

        }
    });


     
}







     


