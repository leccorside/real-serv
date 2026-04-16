//datepicker
$('.datepicker').datepicker({
    format: "dd/mm/yyyy",
    todayBtn: "linked",
    language: "pt-BR",
    autoclose: true,
    todayHighlight: true,
    orientation: "auto",
});

//$(".datepicker").mousedown(function () {
//    $(this).datepicker("hide");
//    $(this).blur();
//});


// disabling dates
var nowTemp = new Date();
var now = new Date(nowTemp.getFullYear(), nowTemp.getMonth(), nowTemp.getDate(), 0, 0, 0, 0);

var checkin = $('.datepickerDe').datepicker({
    format: "dd/mm/yyyy",
    language: "pt-BR",
    orientation: "auto",
    numberOfMonths:2,
    autoclose: true,
    todayHighlight: true,
    onRender: function (date) {
        return date.valueOf() < now.valueOf() ? 'disabled' : '';
    }
}).on('changeDate', function (ev) {
    if (ev.date.valueOf() > checkout.date.valueOf()) {
        var newDate = new Date(ev.date)
        newDate.setDate(newDate.getDate() + 1);
        checkout.setValue(newDate);
    }
    checkin.hide();
    $('.datepickerAte')[0].focus();
}).data('datepicker');
var checkout = $('.datepickerAte').datepicker({
    format: "dd/mm/yyyy",
    orientation: "auto",
    language: "pt-BR",
    numberOfMonths:2,
    autoclose: true,
    todayHighlight: true,
    onRender: function (date) {
        return date.valueOf() <= checkin.date.valueOf() ? 'disabled' : '';
    }
}).on('changeDate', function (ev) {
    checkout.hide();
}).data('datepicker');



//chosen
$(function () {
    $('.chosen-select').chosen();    
    $('.chosen-select-deselect').chosen({ allow_single_deselect: true });
});



//$(".money").maskMoney({ symbol: 'R$ ', thousands: '.', decimal: ',', symbolStay: false, allowNegative: false });
$(".money").maskMoney({ thousands: '.', decimal: ',', symbolStay: false, allowNegative: false, allowZero:true});
$(".moeda").maskMoney({ thousands: '', decimal: ',', symbolStay: false, allowNegative: false, allowZero: true });
$(".number").maskMoney({ thousands: '', decimal: '', symbolStay: false, allowNegative: false, allowZero: true, defaultZero: false });



$(".hourpicker").mask("99:99");

$(".maskdate").mask("99/99/9999");

// === Tooltips === //
$('.tip').tooltip();
$('.tip-left').tooltip({ placement: 'left' });
$('.tip-right').tooltip({ placement: 'right' });
$('.tip-top').tooltip({ placement: 'top' });
$('.tip-bottom').tooltip({ placement: 'bottom' });


$('.nosubmit').keydown(function (e) {
    if (e.keyCode == 13) { // enter key was pressed
        // run own code
        return false; // prevent execution of rest of the script + event propagation / event bubbling + prevent default behaviour
    }
});

$('.disablelink').click(function (e) {
    $(this).data("href", $(this).attr("href")).removeAttr("href");
    e.preventDefault();
});

function ChosenAddNewItem(_id, _tb, _cm ) {
    var select, chosen;

    // Cache the select element as we'll be using it a few times
    select = $("#"+_id);

    // Init the chosen plugin
    select.chosen({ no_results_text: 'Pressione enter para adicionar esse item na lista:' });

    // Get the chosen object
    chosen = select.data('chosen');

    // Bind the keyup event to the search box input
    chosen.dropdown.find('input').on('keyup', function (e) {
        // If we hit Enter and the results list is empty (no matches) add the option
        if (e.which == 13 && chosen.dropdown.find('li.no-results').length > 0) {

            var valor = "";
            var texto = this.value;
            //insere o item
            $.getJSON('/ApiIntegracao/AddItem/', { tb: _tb, cm: _cm, vl: texto }, function (data) {


                if (data.codigo == 200) {
                    valor = data.Objeto;

                    var option = $("<option>").val(valor).text(texto);

                    // Add the new option
                    select.prepend(option);

                    // Automatically select it
                    select.find(option).prop("selected", true);

                    // Trigger the update
                    select.trigger("chosen:updated");


                } else {
                    alert("Erro:" + data.mensagem);
                }

            });


        }
    });
}