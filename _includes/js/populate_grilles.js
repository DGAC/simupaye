
var initDate = function() {
    $("#validity").append($('<option disabled selected value> -- Sélectionner une date -- </option>'));
    for(var d in date) {
        $("#validity").append($('<option value="'+date[d]+'">'+date[d]+'</option>'));
    }
};

var currentYear = "";
var currentGrille = "";

var populateDetache = function(){
    if(currentYear.length == 4) {
        $("#grilleContent").empty();
        var grille = echelons_detachement[currentYear][currentGrille];
        for(var prop in grille){
            var tr = $("<tr><td>"+ prop + "</td><td>"+grille[prop]+"</td><td>"+table_indices[grille[prop]]+"</td></tr>")
            $("#grilleContent").append(tr);
        }
    }
};

var populateIEEAC = function() {
    if(currentYear.length == 4) {
        $("#grilleContent").empty();
        var grille = echelons["ieeac"][currentYear];
        for(var grade in grille){
            for (var prop in grille[grade]) {
                var tr = $("<tr><td>" + grade + " " + prop + "</td><td>"+grille[grade][prop]+"</td><td>" + table_indices[grille[grade][prop]] + "</td></tr>")
                $("#grilleContent").append(tr);
            }
        }
    }
};


var populateGrille = function(){
    switch (currentGrille) {
        case "IEEAC" :
            populateIEEAC();
            break;
        case "CTAC":
        case "CSTAC":
        case "CUTAC":
        case "CST":
        case "CSTP":
            populateDetache();
            break;
    }
};

$(document).ready(function(){
    initDate();

    $('#validity').on('change', function(e) {
        var selected = $(this).find(':selected').text();
        currentYear = selected.substr(selected.length - 4);
        populateGrille();
    });

    $('#grille').on('change', function(e) {
        var selected = $(this).find(':selected').text();
        currentGrille = selected;
        populateGrille();
    });
});