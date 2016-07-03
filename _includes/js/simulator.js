/**
 * Created by Bruno Spyckerelle on 03/07/16.
 */

var compute_income = function(){
    var echelon = parseInt($('#echelon option:selected').text());

    //traitement brut
    var indice = 0;
    var emploi_fonctionnel = $("#emploi_fonctionnel option:selected");
    if($("#emploi_fonctionnel:enabled").length > 0  && emploi_fonctionnel.val().localeCompare('non') !== 0) {
        indice = parseInt($('#echelonbis option:selected').val());
    } else {
        indice = parseInt($('#echelon option:selected').val());
    }

    var nbi = parseInt($('#age option:selected').val());

    var traitement_brut = (indice + nbi)*point_indice;

    //indemnité résidence
    var indem = 0;
    var temp = parseInt($('#region option:selected').val()) / 100 * (indice * point_indice);
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
    temp = parseInt($('#pcs option:selected').val());
    if(!isNaN(temp)) {
        pcs = temp;
    }

    //part fonction
    var fonction = $("#fonction option:selected").val();
    var part_fonction = evs[fonction] + pcs;

    //part expé
    var grade = $("#grade option:selected").val();
    var part_xp = 0;
    if(grade.localeCompare('normal') == 0){
        part_xp = xp["4"];
    } else {
        part_xp = xp["5"];
    }

    //part qualif
    var part_qualif = qualif[grade][echelon];

    var total_pos = traitement_brut + part_fonction + part_qualif + part_xp + indem;
    
    $('#traitement_brut').text(traitement_brut.toFixed(2));
    $('#part_fonction').text(part_fonction.toFixed(2));
    $('#part_xp').text(part_xp.toFixed(2));
    $("#part_qualif").text(part_qualif.toFixed(2));

    //retenue pour pension civile
    var rpc = traitement_brut *  rpc_rate / 100;

    //rafp
    var base_rafp = part_fonction + part_qualif + part_xp + indem;
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

    var total_neg = rafp + cs + csg_deduc + csg_non_deduc + rpc + crds;

    var total = total_pos - total_neg + rembt;

    $("#total").text(total.toFixed(2));
};

var initForm = function () {
    $("#conditions select:gt(0)").attr('disabled', true).empty();
};

var remplir_echelon = function(){
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
    for(var prop in grille) {
        echelon.append($('<option value="'+grille[prop]+'">'+prop+'</option>'));
    }

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

$(document).ready(function(){

    var grade = $('#grade');
    grade.append($('<option disabled selected value> -- Sélectionner un grade -- </option>'));
    $.each(grades, function(index, value){
        var option = $('<option>' + value + '</option>');
        grade.append(option);
    });

    $('#grade').on('change', function(e){
        initForm();
        var val = $(this).val();
        if(val.localeCompare('principal') == 0){
            var emploi = $("#emploi_fonctionnel");
            emploi.append($('<option disabled selected value> -- Sélectionner un emploi fonctionnel -- </option>'));
            $.each(emplois_fonctionnel, function(index, value){
                var option = $("<option>" + value + "</option>");
                emploi.append(option);
            });
            emploi.attr('disabled', false);
        } else {
            remplir_echelon();
        }
    });

    $("#emploi_fonctionnel").on('change', function(e){
        remplir_echelon();
    });

    $("#echelon").on('change', function(e){
        $("#age").attr('disabled', false);
        var age = $("#age");
        age.append("<option disabled selected value> -- Sélectionner l'âge -- </option>");
        age.append('<option value="0">Infèrieur à 35 ans</option>');
        age.append('<option value="75">Supèrieur ou égal à 35 ans</option>');
    });

    $('#age').on('change', function(e){
        var service = $("#service");
        service.attr('disabled', false);
        service.empty();
        service.append($('<option disabled selected value> -- Sélectionner un service -- </option>'));
        for(var prop in fonctions) {
            service.append($('<option>' + prop + "</option>"));
        }
    });

    $("#service").on('change', function(e){
        var fonction = $("#fonction");
        fonction.attr('disabled', false);
        fonction.empty();
        fonction.append($('<option disabled selected value> -- Sélectionner une fonction -- </option>'));
        var val = $(this).val();
        for(var prop in fonctions[val]) {
            fonction.append($('<option value="'+fonctions[val][prop]+'">'+prop+'</option>'));
        }
    });

    $("#fonction").on('change', function(e){
        compute_income();
        $("#region").attr('disabled', false);
        $('#region').empty();
        $('#region').append($('<option disabled selected value> -- Sélectionner un barême -- </option>'));
        $('#region').append($('<option value="0">0%</option>'));
        $('#region').append($('<option value="1">1%</option>'));
        $('#region').append($('<option value="3">3%</option>'));

        $("#pcs").attr('disabled', false);
        $("#pcs").empty();
        $('#pcs').append($('<option disabled selected value> -- Sélectionner un barême -- </option>'));
        $('#pcs').append($('<option value="0">0 €</option>'));
        $('#pcs').append($('<option value="102.40">102,40 €</option>'));
        $('#pcs').append($('<option value="153.60">153,60 €</option>'));
        
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
