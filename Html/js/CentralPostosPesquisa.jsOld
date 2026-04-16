(function () {
    window.onload = init;
})();

function init() {
    CarregarCliente();
}

let clientes = [];
let contatos = [];

function CarregarCliente() {
     
    return Promise.all([
        $.ajax({
            type: "GET",
            url: UrlWsRequisicao + 'ObterCliente',
            //url: 'http://localhost:52327/ApiIntegracao/ObterCliente',
            data: '{}',
            crossDomain: true,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            async: true
        }).then((res) => {
            PaginarCliente(res);
        })
    ]); 
}

function PaginarCliente(clientes) {
    $('#tabelaParticipantes').find('tbody').find('tr').remove();
    var tbody = $('#tabelaParticipantes').find('tbody');
    
    clientes.map(cliente => {
            tbody.append(
                $('<tr>').append($("<td>").append("<button type='button' " +
                        "class='btn btn-default btn-sm' data-toggle='modal' data-target='#myModal' onclick='javascript: AbrirClienteContatos(" + cliente.idcliente + ");'> " +
                        "<span class='glyphicon glyphicon-pencil';'></span></button>"))
                    .append($("<td id=" + cliente.idcliente + ">").append(cliente.idcliente))
                    .append($("<td id='nomeposto" + cliente.idcliente + "'>").append(cliente.posto))
                    .append($("<td>").append(cliente.endereco + ", nro " + cliente.endnro))
                    .append($("<td>").append(cliente.bairro))
                    .append($("<td>").append(cliente.cidade))
                    //.append($("<td>").append(cliente.telefone))
                    .append($("<td>").append(cliente.qtdEnviada))
                    .append($("<td>").append(cliente.qtdRespondida))
                    .append($("<td>").append(cliente.qtdNaoRespondida))
            );
    });

}

function Pesquisar() {

    $.ajax({
        type: "POST",
        contentType: "application/json; charset=utf-8",
        //url: 'http://localhost:52327/ApiIntegracao/ObterPostoSeachAutoComplete/?autoComplete=' + $('#txtPesquisa').val(),
        url: UrlWsRequisicao + 'ObterPostoSeachAutoComplete/?autoComplete=' + $('#txtPesquisa').val(),
        dataType: "json",
        data: JSON.stringify(),
        cache: false,
        beforeSend: function () {
            $.LoadingOverlay("show");
        },
        complete: function () {
            $.LoadingOverlay("hide");
        },
        success: function (resposta) {
            PaginarCliente(resposta);
        },
        error: function (data) {

        }
    });
    
}

function GravarContato() {
    var idcliente       = $('#txtIDPosto').val();
    var nomecontato     = $('#txtContato').val();
    var emailcontato    = $('#txtEmail').val();
    var telefonecontato = $('#txtTelefone').val();
    var unidadecontato  = $('#txtUnidade').val();
    var perfilcontato   = $('#cmbPerfil').val();
    var idcontato       = $('#txtIDContato').val();

    if (Number(idcontato) > 0) {
        $.ajax({
            type: "POST",            
            url: UrlWsRequisicao + 'AtualizarContatoCliente/?idcliente=' + idcliente + '&nomecontato=' + nomecontato + '&emailcontato=' + emailcontato + '&telefonecontato=' + telefonecontato + '&unidadecontato=' + unidadecontato + '&perfilcontato=' + perfilcontato + '&idcontato=' + idcontato,
            //url: 'http://localhost:52327/ApiIntegracao/AtualizarContatoCliente/?idcliente=' + idcliente + '&nomecontato=' + nomecontato + '&emailcontato=' + emailcontato + '&telefonecontato=' + telefonecontato + '&unidadecontato=' + unidadecontato + '&perfilcontato=' + perfilcontato + '&idcontato=' + idcontato,
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
                //PaginarCliente(resposta);
                alert(resposta);
                LimpaCampos();
                CarregarContatos(idcliente);
            },
            error: function (data) {
                alert(resposta);
            }
        });
    } else {
        $.ajax({
            type: "POST",
            url: UrlWsRequisicao + 'GravarContatoCliente/?idcliente=' + idcliente + '&nomecontato=' + nomecontato + '&emailcontato=' + emailcontato + '&telefonecontato=' + telefonecontato + '&unidadecontato=' + unidadecontato + '&perfilcontato=' + perfilcontato,
            //url: 'http://localhost:52327/ApiIntegracao/GravarContatoCliente/?idcliente=' + idcliente + '&nomecontato=' + nomecontato + '&emailcontato=' + emailcontato + '&telefonecontato=' + telefonecontato + '&unidadecontato=' + unidadecontato + '&perfilcontato=' + perfilcontato,
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
                //PaginarCliente(resposta);
                alert(resposta);
                LimpaCampos();
                CarregarContatos(idcliente);
            },
            error: function (data) {
                alert(resposta);
            }
        });
    }


       
}



function LimpaCampos() {
    //$('#myModal').find("input[type=text], input[type=email], input[type=password], textarea").val("");
    $('#txtContato').val("");
    $('#txtEmail').val("");
    $('#txtTelefone').val("");
    $('#txtUnidade').val("");
    $("#cmbPerfil").val("");
    $('#txtIDContato').val("");
}

function AbrirClienteContatos(id) {
    LimpaCampos();
    $('#tabelaClienteContatos').find('tbody').find('tr').remove();
    var tbody = $('#tabelaClienteContatos').find('tbody');

    var idAux      = "nomeposto" + id;
    var nomePosto  = document.getElementById(idAux);
    var txtIDPosto = document.getElementById('txtIDPosto');

    txtIDPosto.value = id;
    txtPosto = document.getElementById('txtPosto');
    txtPosto.value = nomePosto.innerText;

    CarregarContatos(id);

}


function CarregarContatos(idcliente) {
   
    $.ajax({
        type: "POST",
        url: UrlWsRequisicao + 'ObterClienteId/?idcliente=' + idcliente,
        //url: "http://localhost:52327/ApiIntegracao/ObterClienteId/?idcliente=" + idcliente,
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
            PaginarClienteContato(resposta);
        },
        error: function (data) {
            alert("Erro ao tentar listar os contatos.");
        }
    });
     
}

function PaginarClienteContato(dadosContatoCliente) {
    $('#tabelaClienteContatos').find('tbody').find('tr').remove();
    var tbody = $('#tabelaClienteContatos').find('tbody');

    dadosContatoCliente.map(contato => {
        tbody.append(
            $('<tr>').append($("<td>").append("<button type='button' " +
                      "class='btn btn-default btn-sm'  onclick='javascript: EditarContatoCliente(" + contato.idcontato + "," + contato.idcliente  + "); '>" +
                      "<span class='glyphicon glyphicon-pencil';'></span></button>"))


                .append($("<td>").append("<button type='button' " +
                    "class='btn btn-xs' onclick='javascript: ExcluirContatoCliente(" + contato.idcontato + "," + contato.idcliente + ");'> " +
                    "<span class='glyphicon glyphicon-trash';'></button>"))

                .append($("<td>").append("<button type='button' " + 
                     "class='btn btn-xs' data-toggle='modal' data-target='#myModalPesquisa' onclick='javascript: VisualizarPesquisa(" + contato.idcontato + "," + contato.idcliente + ");'> " +
                     "<span class='glyphicon glyphicon-eye-open';'></button>")) 
            
                .append($("<td id='nomeContato" + contato.idcontato + "'>").append(contato.nomecontato))
                .append($("<td id='emailcontato" + contato.idcontato + "'>").append(contato.emailcontato))
                .append($("<td id='telefonecontato" + contato.idcontato + "'>").append(contato.telefonecontato))
                .append($("<td id='perfilcontato" + contato.idcontato + "'>").append(contato.perfilcontato))
                .append($("<td id='unidadecontato" + contato.idcontato + "'>").append(contato.unidadecontato))
        );
    });
}


function VisualizarPesquisa(idcontato, idcliente) {
    var nomePosto = $('#txtPosto').val();
    var nomeContato = document.getElementById('nomeContato' + idcontato);
    $('#txtPostoPesquisa').val(nomePosto);
    $('#txtNomePesquisa').val(nomeContato.innerText);
    $('#txtIdPostoPesquisa').val(idcliente);
        
    $.ajax({
        type: "POST",
        url: UrlWsRequisicao + 'ObterPesquisaId/?idcliente=' + idcliente + '&idcontato=' + idcontato,
        //url: "http://localhost:52327/ApiIntegracao/ObterPesquisaId/?idcliente=" + idcliente + '&idcontato=' + idcontato,
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
           
            PaginarPesquisa(resposta);
         

        },
        error: function (data) {
            alert("Erro ao tentar listar pesquisa.");
        }
    });

}

function PaginarPesquisa(pesquisa) {
    $('#tabelaPesquisaUsuario').find('tbody').find('tr').remove();
    var tbody = $('#tabelaPesquisaUsuario').find('tbody');

    if (pesquisa.length > 0) {
        var resposta1 = pesquisa[0].Pergunta1;
        var resposta2 = pesquisa[0].Pergunta2;
        var resposta3 = pesquisa[0].Pergunta3;
        var resposta4 = pesquisa[0].Pergunta4;
        var span1;
        var span2;
        var span3;
        var span4;

        switch (resposta1) {
            case 0:
                span1 = "-";
                break;
            case 1:
                span1 = "<span class='glyphicon glyphicon-thumbs-down'></span> Ruim";
                break;
            case 2:
                span1 = "<span class='glyphicon glyphicon-thumbs-down'></span> Péssimo";
                break;
            case 3:
                span1 = "<span class='glyphicon glyphicon-thumbs-up'></span> Regular";
                break;
            case 4:
                span1 = "<span class='glyphicon glyphicon-thumbs-up'></span> Boa";
                break;
            case 5:
                span1 = "<span class='glyphicon glyphicon-thumbs-up'></span> Excelente";
                break;
            default:
                span1 = "<span class='glyphicon glyphicon-thumbs-up'></span> Boa";
                break;
        }

        switch (resposta2) {
            case 0:
                span2 = "-";
                break;
            case 1:
                span2 = "<span class='glyphicon glyphicon-thumbs-down'></span> Ruim";
                break;
            case 2:
                span2 = "<span class='glyphicon glyphicon-thumbs-down'></span> Péssimo";
                break;
            case 3:
                span2 = "<span class='glyphicon glyphicon-thumbs-up'></span> Regular";
                break;
            case 4:
                span2 = "<span class='glyphicon glyphicon-thumbs-up'></span> Boa";
                break;
            case 5:
                span2 = "<span class='glyphicon glyphicon-thumbs-up'></span> Excelente";
                break;
            default:
                span2 = "<span class='glyphicon glyphicon-thumbs-up'></span> Boa";
                break;
        }

        switch (resposta3) {
            case 0:
                span3 = "-";
                break;
            case 1:
                span3 = "<span class='glyphicon glyphicon-thumbs-down'></span> Ruim";
                break;
            case 2:
                span3 = "<span class='glyphicon glyphicon-thumbs-down'></span> Péssimo";
                break;
            case 3:
                span3 = "<span class='glyphicon glyphicon-thumbs-up'></span> Regular";
                break;
            case 4:
                span3 = "<span class='glyphicon glyphicon-thumbs-up'></span> Boa";
                break;
            case 5:
                span3 = "<span class='glyphicon glyphicon-thumbs-up'></span> Excelente"
                break;
            default:
                span3 = "<span class='glyphicon glyphicon-thumbs-up'></span> Boa";
                break;
        }

        switch (resposta4) {
            case 0:
                span4 = "-";
                break;
            case 1:
                span4 = "<span class='glyphicon glyphicon-thumbs-down'></span> Ruim";
                break;
            case 2:
                span4 = "<span class='glyphicon glyphicon-thumbs-down'></span> Péssimo";
                break;
            case 3:
                span4 = "<span class='glyphicon glyphicon-thumbs-up'></span> Regular";
                break;
            case 4:
                span4 = "<span class='glyphicon glyphicon-thumbs-up'></span> Boa";
                break;
            case 5:
                span4 = "<span class='glyphicon glyphicon-thumbs-up'></span> Excelente";
                break;
            default:
                span4 = "<span class='glyphicon glyphicon-thumbs-up'></span> Boa";
                break;
        }

        $('#txtEnviadaEm').val(pesquisa[0].Enviada);
        $('#txRespondidaEm').val(pesquisa[0].Respondida);

        pesquisa.map(pesquisa => {
            tbody.append(
                 $('<tr>').append($("<td>").append(span1))
                        .append($("<td>").append(span2))
                        .append($("<td>").append(span3))
                        .append($("<td>").append(span4))
                        .append($("<td>").append(pesquisa.Observacao))

                //$('<tr>').append($("<td>").append(pesquisa.Pergunta1))
                //        .append($("<td>").append(pesquisa.Pergunta2))
                //        .append($("<td>").append(pesquisa.Pergunta3))
                //        .append($("<td>").append(pesquisa.Pergunta4))
                //        .append($("<td>").append(pesquisa.Observacao))
            );
        });



    };

    
}


function EditarContatoCliente(idcontato, idcliente) {

    var nomeContato = document.getElementById('nomeContato' + idcontato);
    var emailcontato = document.getElementById('emailcontato' + idcontato);
    var telefonecontato = document.getElementById('telefonecontato' + idcontato);
    var unidadecontato = document.getElementById('unidadecontato' + idcontato);
    var perfilcontato = document.getElementById('perfilcontato' + idcontato); 
     
    
    $('#txtContato').val(nomeContato.innerText);
    $('#txtEmail').val(emailcontato.innerText);
    $('#txtTelefone').val(telefonecontato.innerText);
    $('#txtUnidade').val(unidadecontato.innerText);
    $('#cmbPerfil').val(perfilcontato.innerText);
    $('#txtIDContato').val(idcontato);
     
}


function ExcluirContatoCliente(idcontato, idcliente) {
    var teste = "";
    if (confirm('Deseja excluir este registro ?')) {

        $.ajax({
            type: "POST",
            url: UrlWsRequisicao + 'ExcluirClienteId/?idcliente=' + idcliente + '&idcontato=' + idcontato,
            //url: "http://localhost:52327/ApiIntegracao/ExcluirClienteId/?idcliente=" + idcliente + '&idcontato=' + idcontato,
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
                CarregarContatos(idcliente);
            },
            error: function (data) {
                alert("Erro ao tentar realizar a exclusão");
            }
        });

    }
}

function EnviarPesquisaTodos() {

    var idcliente = document.getElementById('txtIDPosto');


    if (confirm('Deseja enviar a pesquisa para todos os contatos?' )) {

        $.ajax({
            type: "POST",
            url: UrlWsRequisicao + 'GravarPesquisa/?idcliente=' + idcliente.value,
            //url: "http://localhost:52327/ApiIntegracao/GravarPesquisa/?idcliente=" + idcliente.value,
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
                alert("Erro ao tentar realizar a exclusão");
            }
        });


    }
}