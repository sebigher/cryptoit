//open dropdown fiat selection when user clicks
var dropdown = document.querySelector('.dropdown');
dropdown.addEventListener('click', function(event) {
  event.stopPropagation();
  dropdown.classList.toggle('is-active');
});

//create a variable to hold a user's base fiat currency selection
var fiatSelection = JSON.parse(localStorage.getItem("baseFiat")) || "USD";

//create an array to store responses from API calls
var cryptoListArr = [];
var cryptoInfoArr = [];
var exchangeRateArr = [];
//profit data
//table info
var dynamicDataTable;

function getCryptocurrencyList(baseFiat){
    
    cryptoListArr = [];
    cryptoInfoArr = [];
    exchangeRateArr = [];

    if(dynamicDataTable !== undefined)
    {
      dynamicDataTable.destroy();
    }
    //clear any html out so it doesn't duplicate rows
    $("#crypto-table-rows").empty();
    
    //get api URL (will need to adjust currency=X to match base selected by user)
    var apiURL = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=" + baseFiat + "&order=market_cap_desc&per_page=50&page=1&sparkline=false"

    fetch(apiURL).then(function(response){
        if(response.ok){
            return response.json();
        }
        else{
            return Promise.reject(response);
        }
    }).then(function(data){
        cryptoListArr = data;
        console.log(cryptoListArr);
        getCryptocurrencyData();
    }).catch(function(error){
        console.warn(error);
    });
};

async function getCryptocurrencyData(){

    for (var i=0; i < cryptoListArr.length; i ++){
        var apiURL = "https://api.coingecko.com/api/v3/coins/" + cryptoListArr[i].id + "?market_data=true";
        await fetch(apiURL).then(function(response){
            if(response.ok){
                response.json().then(function(data){
                    //console.log(data);
                    cryptoInfoArr.push({
                        image: data.image.large,
                        coin: data.name,
                        ticker: data.symbol.toUpperCase(),
                        usdPrice: data.market_data.current_price["usd"],
                        eurPrice: data.market_data.current_price["eur"],
                        cnyPrice: data.market_data.current_price["cny"],
                        krwPrice: data.market_data.current_price["krw"],
                        jpyPrice: data.market_data.current_price["jpy"],
                        cadPrice: data.market_data.current_price["cad"],
                        gbpPrice: data.market_data.current_price["gbp"],
                        rubPrice: data.market_data.current_price["rub"],
                        one_day_change: data.market_data.price_change_percentage_24h,
                        week_change: data.market_data.price_change_percentage_7d,
                        eurProfit: "",
                        gbpProfit: "",
                        jpyProfit: "",
                        krwProfit: ""
                    });
                });
                console.log(cryptoInfoArr);
            }
            else{
                return Promise.reject(response);
            }

        });
    }
    getFiatExchangeInfo(fiatSelection);
};

function getFiatExchangeInfo(baseFiat){

    var apiURL = "https://v6.exchangerate-api.com/v6/d39488d42ff5b6cc753183cf/latest/" + baseFiat;

    fetch(apiURL).then(function(response){
        if(response.ok){
          response.json().then(function(data){
            console.log(data);
            //search for table exchange rates
            var usdConversion = data.conversion_rates["USD"];
            var eurConversion = data.conversion_rates["EUR"];
            var cnyConversion = data.conversion_rates["CNY"];
            var krwConversion = data.conversion_rates["KRW"];
            var jpyConversion = data.conversion_rates["JPY"];
            var cadConversion = data.conversion_rates["CAD"];
            var gbpConversion = data.conversion_rates["GBP"];
            var rubConversion = data.conversion_rates["RUB"];

            exchangeRateArr.push(usdConversion, eurConversion, cnyConversion, krwConversion, jpyConversion, cadConversion, gbpConversion, rubConversion);
            console.log(exchangeRateArr);
            performFiatCryptoConversions();
            });
        }
    });

};

function performFiatCryptoConversions(){

    for (var i =0; i < cryptoInfoArr.length; i ++){
        var baseIndexVal = fiatSelection.toLowerCase() + "Price"
        var basePrice = cryptoInfoArr[i][baseIndexVal];

        var priceToEur = cryptoInfoArr[i].eurPrice;
        var convertedEurToBase = (parseFloat(priceToEur)) / (parseFloat(exchangeRateArr[1]));
        var potentialProfitEur = convertedEurToBase - basePrice;
        cryptoInfoArr[i]["eurProfit"] = parseFloat(potentialProfitEur).toFixed(5);

        var priceToGBP = cryptoInfoArr[i].gbpPrice;
        var convertedGBPToBase = (parseFloat(priceToGBP)) / (parseFloat(exchangeRateArr[6]));
        var potentialProfitGBP = convertedGBPToBase - basePrice;
        cryptoInfoArr[i]["gbpProfit"] = parseFloat(potentialProfitGBP).toFixed(5);

        var priceToJPY = cryptoInfoArr[i].jpyPrice;
        var convertedJPYToBase = (parseFloat(priceToJPY)) / (parseFloat(exchangeRateArr[4]));
        var potentialProfitJPY = convertedJPYToBase - basePrice;
        cryptoInfoArr[i]["jpyProfit"] = parseFloat(potentialProfitJPY).toFixed(5);

        var priceToKRW = cryptoInfoArr[i].krwPrice;
        var convertedKRWToBase = (parseFloat(priceToKRW)) / (parseFloat(exchangeRateArr[3]));
        var potentialProfitKRW = convertedKRWToBase - basePrice;
        cryptoInfoArr[i]["krwProfit"] = parseFloat(potentialProfitKRW).toFixed(5);

        //use regex to add 
        var bpString = basePrice.toString().split(".");
        bpString[0] = bpString[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        basePrice = bpString.join(".");


        buildTableData(i, basePrice);
    }
    dynamicDataTable = $("#crypto-table").DataTable();

};

function buildTableData(i, baseFiatPrice){
    console.log("did it.");
    console.log(cryptoInfoArr);
    //create ticker items
    var tickerItemElem = $("<div>").addClass("ticker-item");
    var tickerLogoElem = $("<span>").html('<img src="' + cryptoInfoArr[i].image +'" style="height: 15px; width: 15px;"/>')
    var tickerCryptTick = $("<span>").html(" " + cryptoInfoArr[i].ticker);
    var tickerCryptPerf = $("<span>").html(" " + parseFloat(cryptoInfoArr[i].one_day_change).toFixed(2) + "%"); //.toLocaleString()).toFixed(2) + "%");
    //append ticker items to ticker tape
    tickerItemElem.append(tickerLogoElem);
    tickerItemElem.append(tickerCryptTick);
    tickerItemElem.append(tickerCryptPerf);

    $("#ticker-tape").append(tickerItemElem);

    //create table row
    var tableRowElem = $("<tr>");
    //create table data elements
    var tableFavElem = $("<td>").html('<i class="far fa-crown"></i>');
    var tableIDElem = $("<td>").html("<b>"+ (i+1) + "</b>");
    var tableCoinElem = $("<td>").html('<img src="' + cryptoInfoArr[i].image +'" style="height: auto; width: 25px; float: left;"><span style="padding-left: 25px; font-size: .95em;"> <b>' + cryptoInfoArr[i].coin +'</b></span>');
    var tableCoinTicker = $("<td>").html(cryptoInfoArr[i].ticker);
    var tableCoinPriceBase = $("<td>").html("<span>" + "$" + " </span>" + baseFiatPrice);
    var tableCoinPriceEUR = $("<td>").html(cryptoInfoArr[i].eurProfit);
    var tableCoinPriceGBP = $("<td>").html(cryptoInfoArr[i].gbpProfit);
    var tableCoinPriceJPY = $("<td>").html(cryptoInfoArr[i].jpyProfit);
    var tableCoinPriceKRW = $("<td>").html(cryptoInfoArr[i].krwProfit);
    var tableCoin1D = $("<td>").html(parseFloat(cryptoInfoArr[i].one_day_change).toFixed(2) + "%").addClass("right-text-items");
    var tableCoin7D = $("<td>").html(parseFloat(cryptoInfoArr[i].week_change).toFixed(2) + "%");

    //append elements in the correct order
    tableRowElem.append(tableFavElem);
    tableRowElem.append(tableIDElem);
    tableRowElem.append(tableCoinElem);
    tableRowElem.append(tableCoinTicker);
    tableRowElem.append(tableCoinPriceBase);
    tableRowElem.append(tableCoinPriceEUR);
    tableRowElem.append(tableCoinPriceGBP);
    tableRowElem.append(tableCoinPriceJPY);
    tableRowElem.append(tableCoinPriceKRW);
    tableRowElem.append(tableCoin1D);
    tableRowElem.append(tableCoin7D);

    //get reference to crypto table section and append row
    $("#crypto-table-rows").append(tableRowElem);
};

//Get user fiat selection
$("#dropdown-menu").on("click", function(event){
    event.preventDefault();
    console.log("fired");
    fiatSelection = event.target.getAttribute("data-fiat");
    
    if(fiatSelection != null)
    {
      console.log(fiatSelection);
      $("#base-fiat-select").text("");
      $("#base-fiat-select").html(fiatSelection.toUpperCase() + ' <i class="fas fa-caret-down"></i>');
      //pass fiat selection to the currency exchange api
      // getCurrencyExchangeData(fiatSelection);
      getCryptocurrencyList(fiatSelection);
      //save fiat selection to local storage for page reload
    }
});

getCryptocurrencyList(fiatSelection);