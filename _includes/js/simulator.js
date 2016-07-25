/**
 * Created by Bruno Spyckerelle on 03/07/16.
 */

var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};

var compute_income = function(){

    var activity_rate = activity_rate_2015;
    var prime_tech = prime_tech_2015;
    var rsi = rsi_2015;

    if(year.localeCompare("2016") == 0) {
        activity_rate = activity_rate_2016;
        prime_tech = prime_tech_2016;
        rsi = rsi_2016;
    }

    var echelon = parseInt($('#echelon option:selected').text());

    //traitement brut
    var indice = 0;
    var emploi_fonctionnel = $("#emploi_fonctionnel option:selected");
    if($("#emploi_fonctionnel:enabled").length > 0
        && emploi_fonctionnel.val().localeCompare('non') !== 0
        && emploi_fonctionnel.val() !== '') {
        indice = parseInt($('#echelonbis option:selected').val());
    } else {
        indice = parseInt($('#echelon option:selected').val());
    }

    if(isNaN(indice)) {
        indice = 0;
    }

    var nbi = 0;
    var temp = parseInt($('#age option:selected').val());
    if(!isNaN(temp)) {
        nbi = temp;
    }

    var traitement_brut = (indice + nbi)*point_indice;

    //majoration géographique
    var maj = 1;
    temp = $('#affect option:selected').val();
    if(temp.localeCompare("n-ne") == 0) {
        maj = 1.05;
    }

    //indemnité résidence
    var indem = 0;
    var temp = parseInt($('#region option:selected').val()) / 100 * (traitement_brut);
    if(!isNaN(temp)) {
        indem = temp;
    }

    $('#indem_res').text(indem.toFixed(2));

    //remboursement dom-travail
    var rembt = 0;
    temp = parseFloat($('#rembt').val());
    if(!isNaN(temp)) {
        rembt = temp;
    }

    //pcs
    var pcs = 0;
    temp = parseFloat($('#pcs option:selected').val());
    if(!isNaN(temp)) {
        pcs = temp;
    }

    //rsi
    var fonction = $("#fonction option:selected").val();
    var rsiV = 0;
    if(typeof (fonction) != "undefined") {
        var rsiT = rsi[fonction];
        if(typeof (rsiT) === undefined || isNaN(rsiT)) {
            rsiT = 0;
        }
        rsiV = rsiT * 696 * point_indice * activity_rate / 100 * maj;
    }

    //prime activité
    var grade = $("#grade option:selected").val();
    var prime_activity = activity_rate / 100 * indice * point_indice * maj;

    //prime technicité
    var technicity = 0;
    if(typeof (grade) != "undefined") {
        if(grade.localeCompare("normal") == 0) {
            technicity = prime_tech.normal;
        } else if (grade.localeCompare("principal") == 0 || (grade.localeCompare("hors classe") == 0)) {
            technicity = prime_tech.principal;
        } 
    }

    //supplément familial
    var indiceSFT = Math.min(Math.max((indice+nbi), 449), 716);
    var nombreEnfants = 0;
    var enfants = parseInt($("#famille").val());
    if(!isNaN(enfants)) {
        nombreEnfants = enfants;
    }
    //nombre d'enfants sup à 3
    var enfantsSupp = Math.max(0, nombreEnfants - 3);
    //nombre d'enfants <= 3
    var enfantsMoins = Math.min(nombreEnfants, 3);
    var sft = 0;
    if(nombreEnfants > 0) {
        sft = sft_fixe[enfantsMoins] + sft_prop[enfantsMoins] / 100 * indiceSFT * point_indice
            + enfantsSupp * (sft_fixe["4"] + sft_prop["4"] / 100 * indiceSFT * point_indice);
    }

    //indemnité spéciale
    var special = 178 / 100 * prime_tech.principal;

    var total_pos = traitement_brut + rsiV + prime_activity + technicity + special + indem + pcs + sft;
    
    $('#traitement_brut').text(traitement_brut.toFixed(2));
    $('#rsi').text(rsiV.toFixed(2));
    $('#activity').text(prime_activity.toFixed(2));
    $("#tech").text(technicity.toFixed(2));
    $("#pcsV").text(pcs.toFixed(2));
    $("#special").text(special.toFixed(2));

    //retenue pour pension civile
    var rpc = traitement_brut *  rpc_rate / 100;

    //rafp
    var base_rafp = prime_activity + technicity + rsiV + special + pcs + indem;
    var rafp = 0;
    if(base_rafp < indice * point_indice * 20 / 100) {
        rafp = 5 / 100 * base_rafp;
    } else {
        rafp = 5 / 100 * 20 / 100 * indice * point_indice;
    }

    //csg
    var csg_deduc = 98.25 / 100 * 5.1 / 100 * total_pos;
    var csg_non_deduc = 98.25 / 100 * 2.4 / 100 * total_pos;

    //contrib solidarité
    var cs = (total_pos - rpc - rafp) * 1 / 100;

    //crds
    var crds = total_pos * 98.25 /100 * 0.5 / 100;

    $('#rafp').text(rafp.toFixed(2));
    $("#csg_deduc").text(csg_deduc.toFixed(2));
    $('#csg_non_deduc').text(csg_non_deduc.toFixed(2));
    $("#rpc").text(rpc.toFixed(2));
    $("#crds").text(crds.toFixed(2));
    $('#cs').text(cs.toFixed(2));

    $("#sft").text(sft.toFixed(2));

    var total_neg = rafp + cs + csg_deduc + csg_non_deduc + rpc + crds;

    var total = total_pos - total_neg + rembt;

    $("#total").text(total.toFixed(2));
};

var initForm = function () {
    var grade = $('#grade');
    grade.append($('<option disabled selected value> -- Sélectionner un grade -- </option>'));
    $.each(grades, function(index, value){
        var option = $('<option>' + value + '</option>');
        grade.append(option);
    });

    var service = $("#service");
    service.attr('disabled', false);
    service.empty();
    service.append($('<option disabled selected value> -- Sélectionner un service -- </option>'));
    for(var prop in fonctions_rsi) {
        service.append($('<option>' + prop + "</option>"));
    }

    var emploi = $("#emploi_fonctionnel");
    emploi.append($('<option disabled selected value> -- Sélectionner un emploi fonctionnel -- </option>'));
    $.each(emplois_fonctionnel, function(index, value){
        var option = $("<option>" + value + "</option>");
        emploi.append(option);
    });

    $("#emploi_fonctionnel").closest('.form-group').hide();
    $("#echelonbis").closest('.form-group').hide();

    $('#region').append($('<option disabled selected value> -- Sélectionner un barême -- </option>'));
    $('#region').append($('<option value="0">0%</option>'));
    $('#region').append($('<option value="1">1%</option>'));
    $('#region').append($('<option value="3">3%</option>'));

    $('#pcs').append($('<option disabled selected value> -- Sélectionner un barême -- </option>'));
    $('#pcs').append($('<option value="0">0 €</option>'));
    $('#pcs').append($('<option value="102.40">102,40 €</option>'));
    $('#pcs').append($('<option value="153.60">153,60 €</option>'));
};

var remplir_echelon_normaux = function() {
    var grille = [];

    //échelons normaux
    switch ($('#grade').val()) {
        case 'élève':
            grille = echelons.élève;
            break;
        case 'normal':
            grille = echelons.normal;
            break;
        case 'principal':
            grille = echelons.principal;
            break;
        case 'hors classe':
            grille = echelons.hors_classe;
            break;
    }
    var echelon = $("#echelon");
    echelon.empty();
    echelon.attr('disabled', false);
    echelon.append($('<option disabled selected value> -- Sélectionner un échelon -- </option>'));
    for (var prop in grille) {
        echelon.append($('<option value="' + grille[prop] + '">' + prop + '</option>'));
    }
};

var remplir_echelon_fonctionnels = function () {
    //échelons fonctionnels
    var grillebis = [];
    if($("#grade").val().localeCompare('principal') == 0) {
        switch ($('#emploi_fonctionnel').val()) {
            case 'non':

                break;
            case "1015":
                grillebis = echelons._1015;
                break;
            case "HEA":
                grillebis = echelons.HEA;
                break;
            case "HEB":
                grillebis = echelons.HEB;
                break;
        }
    }
    var echelonbis = $("#echelonbis");
    echelonbis.empty();
    echelonbis.attr('disabled', false);
    echelonbis.append($('<option disabled selected value> -- Sélectionner un échelon fonctionnel -- </option>'));
    for(var prop in grillebis){
        echelonbis.append($('<option value="'+grillebis[prop]+'">'+prop+'</option>'));
    }
};

var year = "2015";

$(document).ready(function(){

    initForm();

    year = getUrlParameter("year");
    if(typeof (year) == "undefined") {
        year = "2016";
    }
    $("#year").text(year);

    $('#grade').on('change', function(e){

        var val = $(this).val();
        var emploi = $("#emploi_fonctionnel");
        var echelonbis = $("#echelonbis");
        if(val.localeCompare('principal') == 0){
            emploi.attr('disabled', false).closest('.form-group').show();
            echelonbis.attr('disabled', false).closest('.form-group').show();
        } else {
            emploi.closest('.form-group').hide();
            echelonbis.closest('.form-group').hide();
            echelonbis.empty();
            emploi.attr('disabled', true);
            echelonbis.attr('disabled', true);
        }
        remplir_echelon_normaux();
        compute_income();
    });

    $("#emploi_fonctionnel").on('change', function(e){
        compute_income();
        remplir_echelon_fonctionnels();
    });

    $("#echelon").on('change', function(e){
        compute_income();
    });

    $("#echelonbis").on('change', function(e){
        compute_income();
    });

    $('#age').on('change', function(e){
        compute_income();
    });

    $("#service").on('change', function(e){
        var fonction = $("#fonction");
        fonction.attr('disabled', false);
        fonction.empty();
        fonction.append($('<option disabled selected value> -- Sélectionner une fonction -- </option>'));
        var val = $(this).val();
        for(var prop in fonctions_rsi[val]) {
            fonction.append($('<option value="'+fonctions_rsi[val][prop]+'">'+prop+'</option>'));
        }
        compute_income();
    });

    $("#fonction").on('change', function(e){
        compute_income();
    });

    $("#famille").on('change', function(e){
        compute_income();
    });

    $("#affect").on('change', function(e){
        compute_income();
    });
    
    $("#region").on('change', function(e) {
       compute_income();
    });

    $('#pcs').on('change', function(e){
        compute_income();
    });

    $('#rembt').on('change', function(e){
        compute_income();
    });
});
