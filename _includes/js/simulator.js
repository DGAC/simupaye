/**
 * Created by Bruno Spyckerelle on 03/07/16.
 */



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

    $('#diff').parent().hide();

};

var previous = -1;
var compute_income = function() {

    //assiette de la crds, csg
    var total_pos = 0;

    //calcul de l'indice
    var indice = table_indices[$("#echelon option:selected").val()];
    //décret 2023-519
    if(currentMoment >= moment('2024-01-01')) {
        indice += 5;
    }
    if(isNaN(indice)){
        indice = 0;
        $("#tooltipEchelon").attr('title', "");
    } else {
        $("#tooltipEchelon").attr('title', "Indice majoré : "+indice);
    }

    var traitement_brut = Math.round(indice*_point_indice*100)/100;
    total_pos += traitement_brut;

    var echelon = $("#echelon option:selected").text();
    if(typeof echelon == "undefined") {
        echelon = "1";
    }

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

    //pcs : majoration de la part fonction non incluse dans le plafonnement à 120%
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
    var grade = $("#grade option:selected").val();
    if(proto) {
        //part fonction
        var niveauEVS = parseInt($('#evs').val());
        var partFonction = 0;
        if(!isNaN(niveauEVS)) {
            partFonction = _evs[niveauEVS];
        }

        total_pos += pcsValue;

        //modulation géographique N/NE de la part Fonction
        //à ne pas confondre avec la majoration N/NE, ancienne PCS
        var modulationPF = 0;
        if(maj > 1 && !isNaN(niveauEVS)) {
            modulationPF = _modulationGeoIEEAC[niveauEVS];
        }

        var rma = 0;
        if($("#rma").is(':checked')) {
            modulationPF += modulationRMA;
        }

        //part expérience
        var partExp = 0;
        switch (corps) {
            case "ieeac":
                if(typeof grade != "undefined") {
                    if(grade.localeCompare("élève") == 0) {
                        //pas de prime
                    } else if(grade.localeCompare("normal") == 0) {
                        partExp = _exp[4];
                    } else {
                        partExp = _exp[5];
                    }
                }
                break;
            default:
        }
        total_pos += partExp;

        //part technique
        var partTech = 0;
        switch(corps) {
            case "ieeac":
                if(typeof grade != "undefined" && typeof echelon != "undefined" && !isNaN(parseInt(echelon))) {
                    switch (grade) {
                        case "élève":
                            //pas de part tech
                            break;
                        case "normal":
                            partTech = _partTechIEEAC["normal"][echelon];
                            break;
                        case "principal":
                            partTech = _partTechIEEAC["principal"][echelon];
                            break;
                        case "hors classe":
                            partTech = _partTechIEEAC["hors classe"][echelon];
                            break;
                        case "détaché":
                            var grilleDetach = $("#detachement option:selected").text();
                            if(typeof grilleDetach != "undefined"){
                                switch (grilleDetach) {
                                    case "CSTAC":
                                        partTech = _partTechIEEAC["CSTAC"][echelon];
                                        break;
                                    case "CTAC":
                                        partTech = _partTechIEEAC["CTAC"][echelon];
                                        break;
                                    default:
                                        partTech = _partTechIEEAC["détaché_autre"]["1"];
                                }
                            }
                    }
                }
                //ajout de la modulation suite revalorisation protocole 2016-2019
                if(!isNaN(niveauEVS)) {
                    modulationPF += _modulationIEEAC[niveauEVS];
                    //la modulation PF est plafonnée à 120% de la PF
                    partFonction = Math.min(partFonction*1.2, partFonction+modulationPF);
                }
                total_pos += partFonction;
                break;
            default:
        }
        total_pos += partTech;

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

        //ajout de la pcs
        total_pos += pcsValue;
    }

    //remboursement dom-travail
    var rembt = 0;
    temp = parseFloat($('#rembt').val());
    if(!isNaN(temp)) {
        rembt = temp;
    }

    var compCSG = 0;
    temp = parseFloat($('#indem_csg').val());
    if(!isNaN(temp)) {
        compCSG = temp;
    }

    var other = 0;
    temp = parseFloat($('#other').val());
    if(!isNaN(temp)) {
        other = temp;
    }
    total_pos += other;

    var retenues = 0;

    //crds
    var crds = total_pos * 98.25 /100 * 0.5 / 100;
    retenues += crds;

    //retenue pour pension civile
    var rpc = traitement_brut * _rpc / 100;
    retenues += rpc;

    //retenue PC NBI
    var rpcnbi = nbi * _rpc / 100;
    retenues += rpcnbi;

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
    //supprimée lors de l'augmentation de la csg en 2018
    var cs = 0;
    if(currentMoment < csgDate) {
        cs = (total_pos - rpc - rafp) * 1 / 100;
        retenues += cs;
    }

    //csg
    var csg_deduc = 98.25 / 100 * _csg_deduc / 100 * (total_pos+rembt);
    var csg_non_deduc = 98.25 / 100 * 2.4 / 100 * (total_pos+rembt);
    retenues += csg_deduc;
    retenues += csg_non_deduc;

    //transfert primes/points
    var transfert = _transfertRetenue;
    retenues += transfert;

    if(currentMoment >= csgDate) {
        total_pos += compCSG;
    }

    var totalImposable = total_pos
        - rafp - csg_deduc - cs - rpc - rpcnbi - transfert;

    var retenueIR = 0;
    if(currentMoment >= irDate) {
        var irTaux = parseFloat($("#tauxIR").val());
        if(!isNaN(irTaux)) {
            retenueIR = totalImposable * irTaux / 100;
        }
    }

    var othernon = 0;
    temp = parseFloat($('#other-non').val());
    if(!isNaN(temp)) {
        othernon = temp;
    }

    var total = total_pos - retenues + rembt +othernon - retenueIR;

    //remplissage des champs
    $("#traitement_brut").text(traitement_brut);
    if(nbi > 0) {
        $("#nbi").text(nbi.toFixed(2)).parent().show();
    } else {
        $("#nbi").parent().hide();
    }
    if(rpcnbi > 0) {
        $("#rpcnbi").text("- " + rpcnbi.toFixed(2)).parent().show();
    } else {
        $("#rpcnbi").parent().hide();
    }
    $('#indem_res').text(indem.toFixed(2));
    $("#crds").text("- " + crds.toFixed(2));
    if(currentMoment < csgDate) {
        $("#cs").text("- " + cs.toFixed(2));
    } else {
        $("#ccsg").text(compCSG.toFixed(2));
    }
    $('#rafp').text("- " + rafp.toFixed(2));
    $("#csg_deduc").text("- " + csg_deduc.toFixed(2));
    $('#csg_non_deduc').text("- " + csg_non_deduc.toFixed(2));
    $("#rpc").text("- " + rpc.toFixed(2));
    $("#sft").text(sft.toFixed(2));
    $("#transfert").text("- " + transfert.toFixed(2));

    $("#ir").text("- " + retenueIR.toFixed(2));

    if(proto) {
        $("#part_fonction").text(partFonction.toFixed(2));
        $("#part_xp").text(partExp.toFixed(2));
        $("#part_technique").text(partTech.toFixed(2));
        if(pcsValue > 0) {
            $("#ris_maj").text(pcsValue.toFixed(2)).parent().show();
        } else {
            $("#ris_maj").parent().hide();
        }
    } else {
        $("#rsiV").text(rsiValue.toFixed(2));
        $("#activity").text(primeActivity.toFixed(2));
        $("#tech").text(technicity.toFixed(2));
        $("#special").text(special.toFixed(2));
        if(pcsValue > 0) {
            $("#pcsV").text(pcsValue.toFixed(2)).parent().show();
        } else {
            $("#pcsV").parent().hide();
        }
    }

    $("#imposable").text(totalImposable.toFixed(2));
    $("#total").text(total.toFixed(2));

    if(previous !== -1) {
        var diff = total - previous;
        $('#diff').text(diff.toFixed(2));
        $('#diff').parent().show();
    }
};

//variables par défaut
var corps = 'ieeac';
var defaultDate = '01/01/2024';
var protoDate = moment('2017-07-01');
var transfertDate = moment('2017-01-01');
var csgDate = moment('2018-01-01');
var currentMoment;
var currentDate = '01/01/2020';
var irDate = moment('2019-01-01');
var proto = true;
var _pcs = pcs["2017"];
var _activity_rate = activity_rate["2016"];
var _yearEchelon = "2018";
var _point_indice = point_indice["2017"];
var _rsi = rsi["2016"];
var _prime_tech = prime_tech["2016"];
var _evs = evs["2017"];
var _exp = exp["2017"];
var _partTechIEEAC = partTechIEEAC["2018"];
var _rpc = rpc_rate["2018"];
var _transfertRetenue = transfertRetenue["2017"];
var _modulationIEEAC = modulation_ieeac["2017"];
var _modulationGeoIEEAC = modulation_geo_ieeac["2017"];
var _csg_deduc = csg_deduc["2018"];

var initVar = function() {
    if(currentDate.localeCompare('01/01/2016') == 0){
        proto = false;
        _pcs = pcs["2015"];
        _activity_rate = activity_rate["2015"];
        _yearEchelon = "2016";
        _point_indice = point_indice["2015"];
        _rsi = rsi["2015"];
        _prime_tech = prime_tech["2015"];
        _evs = evs["2017"];
        _exp = exp["2017"];
        _partTechIEEAC = partTechIEEAC["2017"];
        _transfertRetenue = transfertRetenue["2016"];
        _rpc = rpc_rate["2016"];
        _csg_deduc = csg_deduc["2017"];
    } else if (currentDate.localeCompare('01/07/2016') == 0){
        proto = false;
        _pcs = pcs["2016"];
        _activity_rate = activity_rate["2016"];
        _yearEchelon = "2016";
        _point_indice = point_indice["2016"];
        _rsi = rsi["2016"];
        _prime_tech = prime_tech["2016"];
        _evs = evs["2017"];
        _exp = exp["2017"];
        _partTechIEEAC = partTechIEEAC["2017"];
        _transfertRetenue = transfertRetenue["2016"];
        _rpc = rpc_rate["2016"];
        _csg_deduc = csg_deduc["2017"];
    } else if (currentDate.localeCompare('01/01/2017') == 0){
        proto = false;
        _pcs = pcs["2016"];
        _activity_rate = activity_rate["2016"];
        _yearEchelon = "2017";
        _point_indice = point_indice["2016"];
        _rsi = rsi["2016"];
        _prime_tech = prime_tech["2016"];
        _evs = evs["2017"];
        _exp = exp["2017"];
        _partTechIEEAC = partTechIEEAC["2017"];
        _rpc = rpc_rate["2017"];
        _transfertRetenue = transfertRetenue["2017"];
        _csg_deduc = csg_deduc["2017"];
    } else if (currentDate.localeCompare('01/02/2017') == 0){
        proto = false;
        _pcs = pcs["2017"];
        _activity_rate = activity_rate["2016"];
        _yearEchelon = "2017";
        _point_indice = point_indice["2017"];
        _rsi = rsi["2016"];
        _prime_tech = prime_tech["2016"];
        _evs = evs["2017"];
        _exp = exp["2017"];
        _partTechIEEAC = partTechIEEAC["2017"];
        _rpc = rpc_rate["2017"];
        _transfertRetenue = transfertRetenue["2017"];
        _csg_deduc = csg_deduc["2017"];
    } else if (currentDate.localeCompare('01/07/2017') == 0){
        proto = true;
        _pcs = pcs["2017"];
        _activity_rate = activity_rate["2016"];
        _yearEchelon = "2017";
        _point_indice = point_indice["2017"];
        _rsi = rsi["2016"];
        _prime_tech = prime_tech["2016"];
        _evs = evs["2017"];
        _exp = exp["2017"];
        _partTechIEEAC = partTechIEEAC["2017"];
        _rpc = rpc_rate["2017"];
        _transfertRetenue = transfertRetenue["2017"];
        _csg_deduc = csg_deduc["2017"];
    } else if (currentDate.localeCompare('01/01/2018') == 0){
        proto = true;
        _pcs = pcs["2017"];
        _activity_rate = activity_rate["2016"];
        _yearEchelon = "2018";
        _point_indice = point_indice["2017"];
        _rsi = rsi["2016"];
        _prime_tech = prime_tech["2016"];
        _evs = evs["2017"];
        _exp = exp["2017"];
        _partTechIEEAC = partTechIEEAC["2018"];
        _rpc = rpc_rate["2018"];
        _transfertRetenue = transfertRetenue["2017"];
        _csg_deduc = csg_deduc["2018"];
    } else if (currentDate.localeCompare('01/01/2019') == 0){
        proto = true;
        _pcs = pcs["2017"];
        _activity_rate = activity_rate["2016"];
        _yearEchelon = "2019";
        _point_indice = point_indice["2017"];
        _rsi = rsi["2016"];
        _prime_tech = prime_tech["2016"];
        _evs = evs["2017"];
        _exp = exp["2017"];
        _partTechIEEAC = partTechIEEAC["2019"];
        _rpc = rpc_rate["2019"];
        _transfertRetenue = transfertRetenue["2019"];
        _csg_deduc = csg_deduc["2018"];
    } else if (currentDate.localeCompare('01/01/2020') == 0){
        proto = true;
        _pcs = pcs["2017"];
        _activity_rate = activity_rate["2016"];
        _yearEchelon = "2020";
        _point_indice = point_indice["2017"];
        _rsi = rsi["2016"];
        _prime_tech = prime_tech["2016"];
        _evs = evs["2017"];
        _exp = exp["2017"];
        _partTechIEEAC = partTechIEEAC["2019"];
        _rpc = rpc_rate["2020"];
        _transfertRetenue = transfertRetenue["2019"];
        _csg_deduc = csg_deduc["2018"];
    } else if (currentDate.localeCompare('01/07/2022') == 0){
        proto = true;
        _pcs = pcs["2017"];
        _activity_rate = activity_rate["2016"];
        _yearEchelon = "2020";
        _point_indice = point_indice["2022"];
        _rsi = rsi["2016"];
        _prime_tech = prime_tech["2016"];
        _evs = evs["2017"];
        _exp = exp["2017"];
        _partTechIEEAC = partTechIEEAC["2019"];
        _rpc = rpc_rate["2020"];
        _transfertRetenue = transfertRetenue["2019"];
        _csg_deduc = csg_deduc["2018"];
    } else if (currentDate.localeCompare('01/01/2023') == 0){
        proto = true;
        _pcs = pcs["2017"];
        _activity_rate = activity_rate["2016"];
        _yearEchelon = "2020";
        _point_indice = point_indice["2022"];
        _rsi = rsi["2016"];
        _prime_tech = prime_tech["2016"];
        _evs = evs["2023"];
        _exp = exp["2023"];
        _partTechIEEAC = partTechIEEAC["2023"];
        _rpc = rpc_rate["2020"];
        _transfertRetenue = transfertRetenue["2019"];
        _csg_deduc = csg_deduc["2018"];
    } else if (currentDate.localeCompare('01/07/2023') == 0){
        proto = true;
        _pcs = pcs["2017"];
        _activity_rate = activity_rate["2016"];
        _yearEchelon = "2020";
        _point_indice = point_indice["2023"];
        _rsi = rsi["2016"];
        _prime_tech = prime_tech["2016"];
        _evs = evs["2023"];
        _exp = exp["2023"];
        _partTechIEEAC = partTechIEEAC["2023"];
        _rpc = rpc_rate["2020"];
        _transfertRetenue = transfertRetenue["2019"];
        _csg_deduc = csg_deduc["2018"];
    } else if (currentDate.localeCompare('01/01/2024') == 0){
        proto = true;
        _pcs = pcs["2017"];
        _activity_rate = activity_rate["2016"];
        _yearEchelon = "2020";
        _point_indice = point_indice["2023"];
        _rsi = rsi["2016"];
        _prime_tech = prime_tech["2016"];
        _evs = evs["2023"];
        _exp = exp["2023"];
        _partTechIEEAC = partTechIEEAC["2023"];
        _rpc = rpc_rate["2020"];
        _transfertRetenue = transfertRetenue["2019"];
        _csg_deduc = csg_deduc["2018"];
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
        $("#validity").append($('<option value="'+date[d]+'" class="'+(dateM < protoDate ? 'beforeprotocole' : 'protocole')+'">'+date[d]+'</option>'));
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
                $('#labelpcs').text('Prime de contrainte de service');
                $("#corps-icna").addClass('disabled');
                $("#corps-iessa").addClass('disabled');
                $("#corps-tseeac").addClass('disabled');
            }
        } else {
            //après protocole
            $(".result .ieeac, #conditions .ieeac").hide();
            $(".result .ris, #conditions .ris").show();
            $('#labelpcs').text('Majoration géographique (ex PCS)');
            //autres corps à activer par la suite
            //$("#corps-icna").removeClass('disabled');
            //$("#corps-iessa").removeClass('disabled');
            //$("#corps-tseeac").removeClass('disabled');
        }
        if(currentMoment < transfertDate) {
            $("#transfert").parent().hide();
        } else {
            $("#transfert").parent().show();
        }
        if(currentMoment < csgDate) {
            $("#comp_csg").hide();
            $('#ccsg').parent().hide();
            $("#cs").parent().show();
        } else {
            $("#comp_csg").show();
            $('#ccsg').parent().show();
            $("#cs").parent().hide();
        }
        if(currentMoment < irDate) {
            $("#tauxIRGroup").hide();
            $("#ir").parent().hide();
        } else {
            $("#tauxIRGroup").show();
            $("#ir").parent().show();
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

    $('li.corps.disabled a').on('click', function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
    });

    $('li.corps a').on('click', function(e){
        var c = $(this).closest('li').data('corps');
        if(c.localeCompare('ieeac') != 0) {
            $("#validity option.beforeprotocole").attr('disabled', 'disabled');
            $("#evs").attr("min", 0);
        } else {
            $("#validity option.beforeprotocole").removeAttr('disabled');
            $("#evs").attr("min", 10);
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
            var detachVal = $("#detachement").val();
            var echelForm = $("#echelon");
            echelForm.empty().append($('<option disabled selected value> -- Sélectionner un échelon -- </option>'));
            if(typeof detachVal != "undefined") {
                var grille = echelons_detachement[_yearEchelon][detachVal];
                for(var prop in grille) {
                    echelForm.append($('<option value="' + grille[prop] + '">' + prop + '</option>'));
                }
            }
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

    $('#indem_csg').on('change', function(e){
        compute_income();
    });

    $('#rma').on('change', function(e) {
       compute_income();
    });

    $("#other").on('change', function(e){
        compute_income();
    });

    $("#other-non").on('change', function(e){
        compute_income();
    });

    $("#tauxIR").on('change', function(e){
        compute_income();
    });

    $('#store').on('click', function(e) {
        e.preventDefault();
        previous = parseFloat($('#total').text());
    });

    $('[data-toggle="tooltip"]').tooltip();
});
