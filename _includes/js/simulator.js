/**
 * Created by Bruno Spyckerelle on 03/07/16.
 */

var compute_income_protocole = function(){
    var activity_rate = activity_rate_2016;
    var prime_tech = prime_tech_2016;

    var rsi = rsi_2016;
    var point_indice = point_indice_2017;

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

    var traitement_brut = indice*point_indice;

    var nbi = nbi*point_indice;

    //indemnité résidence
    var indem = 0;
    var temp = parseInt($('#region option:selected').val()) / 100 * (traitement_brut + nbi);
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

    var maj = false;
    temp = $('#affect option:selected').val();
    if(temp.localeCompare("n-ne") == 0) {
        maj = true;
    }

    //part fonction
    var fonction = $("#fonction option:selected").val();
    var part_fonction = 0;
    if(typeof (fonction) != "undefined") {
        var evsV = evs[fonction];
        if(typeof (evsV) === undefined || isNaN(evsV)) {
            evsV = 0;
        }
        part_fonction = evsV + pcs;
    }

    var majValue = 0;
    if(maj) {
        if(typeof (fonction) != "undefined") {
            majValue += majFonction[fonction];
        }
        //part de la maj géo avec l'ancien calcul
        //en attendant les chiffres officiels
        var indiceActivity = Math.min(696, indice);
        majValue += 0.05 * point_indice * indiceActivity * activity_rate / 100;
    }

    //part expé
    var grade = $("#grade option:selected").val();
    var part_xp = 0;
    if(grade.localeCompare('normal') == 0){
        part_xp = xp["4"];
    } else {
        part_xp = xp["5"];
    }

    //part qualif
    var part_qualif = 0;
    if(typeof (grade) != "undefined" && !isNaN(echelon)) {
        part_qualif = qualif[grade][echelon];
    }

    //supplément familial
    var indiceSFT = Math.min(Math.max(indice, 449), 716);
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

    $("#sft").text(sft.toFixed(2));

    var total_pos = traitement_brut +nbi + part_fonction + part_qualif + part_xp + indem + sft + majValue;

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

    var total_neg = rafp + cs + csg_deduc + csg_non_deduc + rpc + crds;

    var total = total_pos - total_neg + rembt;

    var totalBefore = compute_income_before(false);

    var gain = total - totalBefore;

    $('#traitement_brut').text(traitement_brut.toFixed(2));
    $('#nbi').text(nbi.toFixed(2));
    $('#part_fonction').text(part_fonction.toFixed(2));
    $('#part_xp').text(part_xp.toFixed(2));
    $("#part_qualif").text(part_qualif.toFixed(2));
    $("#maj").text(majValue.toFixed(2));
    $('#rafp').text("- "+rafp.toFixed(2));
    $("#csg_deduc").text("- "+csg_deduc.toFixed(2));
    $('#csg_non_deduc').text("- "+csg_non_deduc.toFixed(2));
    $("#rpc").text("- "+rpc.toFixed(2));
    $("#crds").text("- "+crds.toFixed(2));
    $('#cs').text("- "+cs.toFixed(2));
    $("#total").text(total.toFixed(2));
    $("#gain").text(gain.toFixed(2));

    return total;
};

var compute_income_before = function(populate){

    if(typeof populate == 'undefined') {
        populate = true;
    }

    var activity_rate = activity_rate_2015;
    var prime_tech = prime_tech_2015;
    var rsi = rsi_2015;
    var point_indice = point_indice_2015;

    if(year == 2016) {
        activity_rate = activity_rate_2016;
        prime_tech = prime_tech_2016;
        rsi = rsi_2016;
        point_indice = point_indice_2016;
    }

    if(year == 2017) {
        activity_rate = activity_rate_2016;
        prime_tech = prime_tech_2016;
        rsi = rsi_2016;
        point_indice = point_indice_2017;
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

    var traitement_brut = indice*point_indice;

    var nbi = nbi*point_indice;

    //majoration géographique
    var maj = 1;
    temp = $('#affect option:selected').val();
    if(temp.localeCompare("n-ne") == 0) {
        maj = 1.05;
    }

    //indemnité résidence
    var indem = 0;
    var temp = parseInt($('#region option:selected').val()) / 100 * (traitement_brut + nbi);
    if(!isNaN(temp)) {
        indem = temp;
    }

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
    if(document.location.pathname.indexOf('protocole') > 0) {
        var selectedService = $("#service option:selected").text();
        var selectedFonction = $("#fonction option:selected").text();
        if(selectedFonction.length > 0 && selectedService.length > 0) {
            fonction = fonctions_rsi[selectedService][selectedFonction];
        }
    }
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
    var indiceActivity = Math.min(696, indice);
    var prime_activity = activity_rate / 100 * indiceActivity * point_indice * maj;

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

    var total_pos = traitement_brut + nbi + rsiV + prime_activity + technicity + special + indem + pcs + sft;



    //retenue pour pension civile
    var rpc = (traitement_brut + nbi) *  rpc_rate / 100;

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
    var total_neg = rafp + cs + csg_deduc + csg_non_deduc + rpc + crds;

    var total = total_pos - total_neg + rembt;

    if(populate) {
        $('#traitement_brut').text(traitement_brut.toFixed(2));
        $('#nbi').text(nbi.toFixed(2));
        $('#rsi').text(rsiV.toFixed(2));
        $('#activity').text(prime_activity.toFixed(2));
        $("#tech").text(technicity.toFixed(2));
        $("#pcsV").text(pcs.toFixed(2));
        $("#special").text(special.toFixed(2));
        $('#indem_res').text(indem.toFixed(2));
        $('#rafp').text("- " + rafp.toFixed(2));
        $("#csg_deduc").text("- " + csg_deduc.toFixed(2));
        $('#csg_non_deduc').text("- " + csg_non_deduc.toFixed(2));
        $("#rpc").text("- " + rpc.toFixed(2));
        $("#crds").text("- " + crds.toFixed(2));
        $('#cs').text("- " + cs.toFixed(2));
        $("#sft").text(sft.toFixed(2));
        $("#total").text(total.toFixed(2));
    }

    return total;
};

var initForm = function () {
    var grade = $('#grade');
    grade.empty();
    grade.append($('<option disabled selected value> -- Sélectionner un grade -- </option>'));
    $.each(grades[corps], function(index, value){
        var option = $('<option>' + value + '</option>');
        grade.append(option);
    });

    var detachement = $("#detachement");
    detachement.empty().closest('.form-group').hide();
    detachement.append($('<option disabled selected value> -- Sélectionner une grille -- </option>'));
    $.each(detachements, function(index, value){
        var option = $('<option>' + value + '</option>');
        detachement.append(option);
    });

    //reset echelons
    $("#echelons").empty();

    $("#region").empty();
    $('#region').append($('<option disabled selected value> -- Sélectionner un barême -- </option>'));
    $('#region').append($('<option value="0">0%</option>'));
    $('#region').append($('<option value="1">1%</option>'));
    $('#region').append($('<option value="3">3%</option>'));

    var pcs150 = _pcs*1.5;
    $('#pcs').empty();
    $('#pcs').append($('<option disabled selected value> -- Sélectionner un barême -- </option>'));
    $('#pcs').append($('<option value="0">0 €</option>'));
    $('#pcs').append($('<option value="pcs">'+_pcs+' €</option>'));
    $('#pcs').append($('<option value="pcs150">'+pcs150.toFixed(2)+' €</option>'));

};

var compute_income = function() {

    //assiette de la crds, csg
    var total_pos = 0;

    //calcul de l'indice
    var indice = parseInt($("#echelon option:selected").val());
    if(isNaN(indice)){
        indice = 0;
    }

    var traitement_brut = indice*_point_indice;
    total_pos += traitement_brut;

    var nbi = parseInt($('#age option:selected').val());
    if(isNaN(nbi)) {
        nbi = 0;
    } else {
        nbi = nbi * points_nbi[corps]*_point_indice;
    }
    total_pos += nbi;

    //indemnité résidence
    var indem = 0;
    var temp = parseInt($('#region option:selected').val()) / 100 * (traitement_brut + nbi);
    if(!isNaN(temp)) {
        indem = temp;
    }
    total_pos += indem;

    //majoration géographique
    var maj = 1;
    temp = $('#affect option:selected').val();
    if(temp.localeCompare("n-ne") == 0) {
        maj = 1.05;
    }

    //pcs
    var pcsValue = 0;
    var pcsOption = $("#pcs option:selected").val();
    if(typeof pcsOption == "undefined") {
        // pas de pcs ?
    } else {
        if(pcsOption.localeCompare("pcs") == 0) {
            pcsValue = _pcs;
        } else if(pcsOption.localeCompare("pcs150") == 0) {
            pcsValue = _pcs * 1.5;
        }
    }
    total_pos += pcsValue;

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
        sft = sft_fixe[enfantsMoins]
            + sft_prop[enfantsMoins] / 100 * indiceSFT * _point_indice
            + enfantsSupp * (sft_fixe["4"] + sft_prop["4"] / 100 * indiceSFT * _point_indice);
    }
    total_pos += sft;


    //calculs spécifiques avant ou après RIST
    if(proto) {

    } else {
        //calcul uniquement disponible pour les ieeac
        //rsi
        var niveauRSI = parseInt($("#rsi").val());
        var rsiValue = 0;
        if(!isNaN(niveauRSI)){
            rsiValue = _rsi[niveauRSI] * 696 * _point_indice * _activity_rate / 100 * maj;
        }
        total_pos += rsiValue;

        //prime activité
        var indiceActivity = Math.min(696, indice);
        var primeActivity = _activity_rate / 100 * indiceActivity * _point_indice * maj;
        total_pos += primeActivity;

        //prime technicité
        var technicity = 0;
        var grade = $("#grade option:selected").val();
        if(typeof grade != "undefined") {
            if(grade.localeCompare("élève") == 0) {
                //pas de prime
            } else if(grade.localeCompare("normal") == 0) {
                technicity = _prime_tech["normal"];
            } else {
                technicity = _prime_tech["principal"];
            }
        }
        total_pos += technicity;

        //indemnité spéciale
        var special = 178 / 100 * _prime_tech.principal;
        total_pos += special;
    }

    //remboursement dom-travail
    var rembt = 0;
    temp = parseFloat($('#rembt').val());
    if(!isNaN(temp)) {
        rembt = temp;
    }

    var retenues = 0;

    //crds
    var crds = total_pos * 98.25 /100 * 0.5 / 100;
    retenues += crds;

    //retenue pour pension civile
    var rpc = (traitement_brut + nbi) * rpc_rate / 100;
    retenues += rpc;

    //rafp
    var rafp = 0;
    var base_rafp = total_pos - (traitement_brut + nbi + sft);
    if(base_rafp < indice * _point_indice * 20 / 100) {
        rafp = 5 / 100 * base_rafp;
    } else {
        rafp = 5 / 100 * 20 / 100 * indice * _point_indice;
    }
    retenues += rafp;

    //contribution solidarité
    var cs = (total_pos - rpc - rafp) * 1 / 100;
    retenues += cs;

    //csg
    var csg_deduc = 98.25 / 100 * 5.1 / 100 * total_pos;
    var csg_non_deduc = 98.25 / 100 * 2.4 / 100 * total_pos;
    retenues += csg_deduc;
    retenues += csg_non_deduc;

    var total = total_pos - retenues + rembt;
    //remplissage des champs
    $("#traitement_brut").text(traitement_brut.toFixed(2));
    $("#nbi").text(nbi.toFixed(2));
    $('#indem_res').text(indem.toFixed(2));
    $("#crds").text("- " + crds.toFixed(2));
    $("#cs").text("- " + cs.toFixed(2));
    $('#rafp').text("- " + rafp.toFixed(2));
    $("#csg_deduc").text("- " + csg_deduc.toFixed(2));
    $('#csg_non_deduc').text("- " + csg_non_deduc.toFixed(2));
    $("#rpc").text("- " + rpc.toFixed(2));
    $("#pcsV").text(pcsValue.toFixed(2));
    $("#sft").text(sft.toFixed(2));
    if(proto) {

    } else {

        $("#rsiV").text(rsiValue.toFixed(2));
        $("#activity").text(primeActivity.toFixed(2));
        $("#tech").text(technicity.toFixed(2));
        $("#special").text(special.toFixed(2));
    }

    $("#total").text(total.toFixed(2));

};

//variables par défaut
var corps = 'ieeac';
var defaultDate = '01/02/2017';
var protoDate = moment('2017-07-01');
var currentMoment;
var currentDate = '01/02/2017';
var proto = false;
var _pcs = pcs["2015"];
var _activity_rate = activity_rate["2015"];
var _yearEchelon = "2016";
var _point_indice = point_indice["2015"];
var _rsi = rsi["2015"];
var _prime_tech = prime_tech["2015"];
var _qualif_ieeac = qualif_ieeac["2017"];

var initVar = function() {
    if(currentDate.localeCompare('01/01/2016') == 0){
        proto = false;
        _pcs = pcs["2015"];
        _activity_rate = activity_rate["2015"];
        _yearEchelon = "2016";
        _point_indice = point_indice["2015"];
        _rsi = rsi["2015"];
        _prime_tech = prime_tech["2015"];
    } else if (currentDate.localeCompare('01/07/2016') == 0){
        proto = false;
        _pcs = pcs["2016"];
        _activity_rate = activity_rate["2016"];
        _yearEchelon = "2016";
        _point_indice = point_indice["2016"];
        _rsi = rsi["2016"];
        _prime_tech = prime_tech["2016"];
    } else if (currentDate.localeCompare('01/01/2017') == 0){
        proto = false;
        _pcs = pcs["2016"];
        _activity_rate = activity_rate["2016"];
        _yearEchelon = "2017";
        _point_indice = point_indice["2016"];
        _rsi = rsi["2016"];
        _prime_tech = prime_tech["2016"];
    } else if (currentDate.localeCompare('01/02/2017') == 0){
        proto = false;
        _pcs = pcs["2017"];
        _activity_rate = activity_rate["2016"];
        _yearEchelon = "2017";
        _point_indice = point_indice["2017"];
        _rsi = rsi["2016"];
        _prime_tech = prime_tech["2016"];
    } else if (currentDate.localeCompare('01/07/2017') == 0){
        proto = true;
        _pcs = pcs["2017"];
        _activity_rate = activity_rate["2016"];
        _yearEchelon = "2017";
        _point_indice = point_indice["2017"];
        _rsi = rsi["2016"];
        _prime_tech = prime_tech["2016"];
        _qualif_ieeac = qualif_ieeac["2017"];
    } else if (currentDate.localeCompare('01/01/2018') == 0){
        proto = true;
        _pcs = pcs["2017"];
        _activity_rate = activity_rate["2016"];
        _yearEchelon = "2018";
        _point_indice = point_indice["2017"];
        _rsi = rsi["2016"];
        _prime_tech = prime_tech["2016"];
        _qualif_ieeac = qualif_ieeac["2018"];
    } else if (currentDate.localeCompare('01/07/2018') == 0){
        proto = true;
        _pcs = pcs["2017"];
        _activity_rate = activity_rate["2016"];
        _yearEchelon = "2018";
        _point_indice = point_indice["2017"];
        _rsi = rsi["2016"];
        _prime_tech = prime_tech["2016"];
        _qualif_ieeac = qualif_ieeac["2018"];
    } else if (currentDate.localeCompare('01/01/2019') == 0){
        proto = true;
        _pcs = pcs["2017"];
        _activity_rate = activity_rate["2016"];
        _yearEchelon = "2019";
        _point_indice = point_indice["2017"];
        _rsi = rsi["2016"];
        _prime_tech = prime_tech["2016"];
        _qualif_ieeac = qualif_ieeac["2019"];
    }
};

var updateEchelons = function() {
    var grade = $("#grade").val();
    if(grade !== null) {
        if(grade.localeCompare("détaché") == 0) {
            var detach = $("#detachement").val();
            if(detach !== null) {
                var grille = echelons_detachement[_yearEchelon][detach];
                for(var prop in grille) {
                    $("#echelon option")
                        .filter(function(){return $(this).html() == prop})
                        .val(grille[prop]);
                }
            }
        } else {
            var grille = echelons[corps][_yearEchelon][grade];
            for(var prop in grille){
                $("#echelon option")
                    .filter(function(){return $(this).html() == prop})
                    .val(grille[prop]);
            }
        }
    }
};

$(document).ready(function(){

    initForm();
    $("#validity").append($('<option disabled selected value> -- Sélectionner une date -- </option>'));
    for(var d in date) {
        var dateM = moment(date[d], 'DD/MM/YYYY');
        $("#validity").append($('<option value="'+date[d]+'" class="'+(dateM < proto ? 'beforeprotocole' : 'protocole')+'">'+date[d]+'</option>'));
    }

    $('#validity').on('change', function(e) {
        currentDate = $(this).find(':selected').text();
        currentMoment = moment(currentDate, 'DD/MM/YYYY');
        if(currentMoment < protoDate){
            //avant protocole
            //seul ieeac possible
            if(corps.localeCompare('ieeac') == 0) {
                $(".result .ieeac, #conditions .ieeac").show();
                $(".result .ris, #conditions .ris").hide();
                $("#corps-icna").addClass('disabled');
                $("#corps-iessa").addClass('disabled');
                $("#corps-tseeac").addClass('disabled');
            }
        } else {
            //après protocole
            $(".result .ieeac, #conditions .ieeac").hide();
            $(".result .ris, #conditions .ris").show();
            $("#corps-icna").removeClass('disabled');
            $("#corps-iessa").removeClass('disabled');
            $("#corps-tseeac").removeClass('disabled');
        }
        initVar();
        //changement de valeur pour la PCS
        $('#pcs option[value="pcs"]').text(_pcs);
        var pcs150 = _pcs * 1.5;
        $('#pcs option[value="pcs150"]').text(pcs150.toFixed(2));
        updateEchelons();
        compute_income();
    });

    $('#validity').val(defaultDate).change(); //init Form with default date

    $('li.corps a').on('click', function(e){
        var c = $(this).closest('li').data('corps');
        if(c.localeCompare('ieeac') != 0) {
            $("#validity option.beforeprotocole").attr('disabled', 'disabled');
        } else {
            $("#validity option.beforeprotocole").removeAttr('disabled');
        }
        compute_income();
    });

    //init modal evs
    var options = {
        valueNames: ['name', 'evs'],
        item: '<tr><td class="name"></td><td class="evs"></td><td><button data-dismiss="modal" class="use-evs btn btn-default btn-sm">Utiliser</button></td></tr>'
    };
    var evsList = new List('evs_table', options, fonctions);
    evsList.sort('evs', {order: 'asc'});
    $("#search-fonction").on('keyup', function () {
        var searchString = $(this).val();
        evsList.fuzzySearch(searchString);
    });

    $(".use-evs").on('click', function (e) {
        var value = $(this).closest('tr').find('.evs').text();
        $("#evs").val(parseInt(value)).trigger('change');
    });

    //init modal rsi
    var options_rsi = {
        valueNames: ['name', 'rsi'],
        item: '<tr><td class="name"></td><td class="rsi"></td><td><button data-dismiss="modal" class="use-rsi btn btn-default btn-sm">Utiliser</button></td></tr>'
    };
    var rsiList = new List('rsi_table', options_rsi, fonctions.filter(function(obj){return obj.rsi > 0}));
    rsiList.sort('rsi', {order: 'asc'});
    $("#search-fonction-rsi").on('keyup', function(){
        var searchString = $(this).val();
        rsiList.fuzzySearch(searchString);
    });
    $(".use-rsi").on('click', function(e){
        var value = $(this).closest('tr').find('.rsi').text();
        $("#rsi").val(parseInt(value)).trigger('change');
    });

    $('.corps a').on('click', function(e){
        $('.corps').removeClass('active');
        $(this).parent().addClass('active');
        corps = $(this).parent().data('corps');
        initForm();
        compute_income();
    });

    $('#grade').on('change', function(e){
        var val = $(this).val();
        if(val.localeCompare("détaché") == 0) {
            $("#detachForm").show();
        } else {
            $("#detachForm").hide();
            var echel = echelons[corps][_yearEchelon][val];
            var echelForm = $("#echelon");
            echelForm.empty().append($('<option disabled selected value> -- Sélectionner un échelon -- </option>'));
            for(var prop in echel) {
                echelForm.append($('<option value="' + echel[prop] + '">' + prop + '</option>'));
            }
        }
        compute_income();
    });

    $("#detachement").on('change', function(e) {
        var val = $(this).val();
        var grille = echelons_detachement[_yearEchelon][val];
        var echelForm = $("#echelon");
        echelForm.empty().append($('<option disabled selected value> -- Sélectionner un échelon -- </option>'));
        for(var prop in grille) {
            echelForm.append($('<option value="'+grille[prop]+'">' + prop + '</option>'));
        }
        compute_income();
    });

    $("#echelon").on('change', function(e){
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
        for(var prop in _fonctions[val]) {
            fonction.append($('<option value="'+_fonctions[val][prop]+'">'+prop+'</option>'));
        }
        compute_income();
    });

    $("#rsi").on('change keyup', function(e){
        compute_income();
    });

    $("#evs").on('change keyup', function(e){
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

    $('[data-toggle="tooltip"]').tooltip();
});
