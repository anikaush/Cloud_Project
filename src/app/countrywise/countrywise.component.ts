import { Component, OnInit } from '@angular/core';
import { AngularFirestore, DocumentData } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import { Color, Label, SingleDataSet, monkeyPatchChartJsLegend, monkeyPatchChartJsTooltip } from 'ng2-charts';
import { Subscription } from 'rxjs/internal/Subscription';
import { CovidService } from '../covid.service';
import { News } from '../news.model';
import { Summary } from '../summary.model';
import { User } from '../user.model';
import {formatDate, getLocaleMonthNames} from '@angular/common';


@Component({
  selector: 'app-countrywise',
  templateUrl: './countrywise.component.html',
  styleUrls: ['./countrywise.component.css']
})
export class CountrywiseComponent implements OnInit {

  country: string;
  countryCode: string;
  countrySlug: string;

  //Pie Chart
  public pieChartOptions: ChartOptions = {responsive: true,};
  public pieChartLabels: Label[] = [['Dead Cases'], ['Recovered Cases'], 'Active Cases'];
  public pieChartData: SingleDataSet = [1, 1, 1];
  public pieChartType: ChartType = 'pie';
  public pieChartLegend = true;
  public pieChartPlugins = [];

  //Bar Graph
  public barChartOptions: ChartOptions = {responsive: true,};
  public barChartLabels: Label[] = [];
  public barChartType: ChartType = 'bar';
  public barChartLegend = true;
  public barChartPlugins = [];
  public barChartData: ChartDataSets[] = [];

  //Linear Chart
  public lineChartData: ChartDataSets[] = [];
  public lineChartLabels: Label[] = [];
  public lineChartOptions: ChartOptions = {
    responsive: true,
  };
  public lineChartColors: Color[] = [
    {
      borderColor: 'black',
      backgroundColor: 'rgba(255,0,0,0.3)',
    },
  ];
  public lineChartLegend = true;
  public lineChartType: ChartType = 'line';
  public lineChartPlugins = [];

  user: User;
  description: string="";
  cases: {name: String, value: number}[]
  recovered: {name: String, value: number}[]
  death: {name: String, value: number}[]
  countries: {name: String, values: number[]}[]
  tableCountriesHead = ["New Cases",
                        "Total Cases",
                        "New Recoveries",
                        "Total Recoveries",
                        "New Deaths",
                        "Total Deaths"];
  summarySubscription: Subscription;
  summaryTillTodaySubscription: Subscription;
  summaryOf7daysSubscription: Subscription;
  countriesSubscription: Subscription;
  countrySubscription: Subscription;
  numberOfTimes = 0;
  numberOfTimes2 = 0;
  numberOfTimes3 = 0;
  news : News[]=[];
  superuser: Array<Object> | any;
  userStatus = new String;

  constructor(public covidService:CovidService, public router: Router, private firestore: AngularFirestore) {
    monkeyPatchChartJsTooltip();
    monkeyPatchChartJsLegend();
   }

goBack(){
  this.router.navigate['signin'];
}
  ngOnInit(): void {
    this.checkURI();
    this.user = this.covidService.getUser();
    this.countriesSubscription = this.covidService.countriesSubject.subscribe(
      (data: {name: string, values:number[]}[]) => {
        this.countries = data;
      }
    )
    this.countrySubscription = this.covidService.countrySubject.subscribe(
      (data: string[]) => {
        this.country = data[0];
        this.countryCode = data[1];
        if(this.numberOfTimes2==0){
          this.checkFireStore();
          this.numberOfTimes2++;
        }
      }
    )
   this.summarySubscription = this.covidService.summaryCountrySubject.subscribe(
    (data: {name: string, values:number[]}) => {
        if(data.values.length > 0){
          if(this.numberOfTimes3==0 && this.countrySlug==data.name){
          this.cases = []; this.recovered = []; this.death = []
          this.cases = [{name:"Total Cases",value:data.values[0]}, 
                        {name: "New Cases", value: data.values[1]}, 
                        {name: "Active Cases", value: data.values[2]}];
          this.recovered = [{name: "Total Recovered", value: data.values[3]}, 
                            {name: "New Recovered", value: data.values[4]}, 
                            {name: "Recovery Rate", value: data.values[5]}];
          this.death = [{name: "Total Death", value: data.values[6]},
                        {name: "New Deaths", value: data.values[7]}, 
                        {name: "Mortality Rate", value: data.values[8]}];
          
          let newSummary : Summary = {                              //Database update
            date:new Date().toString(),
            TotalConfirmed: data.values[0].toString(),
            NewConfirmed: data.values[1].toString(),
            TotalRecovered: data.values[3].toString(),
            NewRecovered: data.values[4].toString(),
            TotalDeaths: data.values[6].toString(),
            NewDeaths: data.values[7].toString()
          }
          console.log("Storing data in firestore")

            console.log("update "+this.countrySlug)
            this.resetPieChart([data.values[6], data.values[3], data.values[2]])      //Pie Chart
            console.log([data.values[6], data.values[3], data.values[2]])
            this.firestore.collection("summary").doc(this.countrySlug).set(newSummary);
            this.numberOfTimes3++;
          }
        }
    }
    );
    this.summaryOf7daysSubscription = this.covidService.summaryOf7daysSubject.subscribe(
      (data7days: number[][]) => {
        this.barChartData = [];
        this.barChartData = [
          { data: data7days[0], label: 'Daily Deaths' },
          { data: data7days[1], label: 'Daily Recovered' },
          { data: data7days[2], label: 'Daily Cases' }
        ];
    }
    );

    this.summaryTillTodaySubscription = this.covidService.summaryTillTodaySubject.subscribe(
      (dataFrom: number[][]) => {
        this.lineChartData = [];
          var today = (new Date()).toISOString().slice(0,10)
        for (var i=0;i<dataFrom[0].length;i++){

          this.lineChartLabels.push(("0"+new Date(dataFrom[3][i]).getDate()).slice(-2)+ " "+ this.getmonth(new Date(dataFrom[3][i]).getMonth()));

          console.log(i.toString())
        }
        this.lineChartData = [
          { data: dataFrom[0], label: 'Total Deaths' },
          { data: dataFrom[1], label: 'Total Recovered' },
          { data: dataFrom[2], label: 'Total Cases' }
        ];
    }
    );
    
    this.barChartLabels = [];                    //Bar garph for 7 days
    var x = new Date();
    for (var i = 0; i < 7; i++) {
      this.barChartLabels.unshift(x.getDate()+' '+x.toLocaleString('en-us', { month: 'short' }));
      if(i == 6)
      continue;
      x.setDate(x.getDate()-1);
    }
    x.setDate(x.getDate()-1);
    var day0 = (x.toISOString().slice(0,10));
    var day7 = (new Date()).toISOString().slice(0,10);
    this.covidService.getSummaryOf7days(day0, day7, this.countrySlug);
    this.covidService.getSummaryTillToday(this.countrySlug);
    this.getNews().subscribe((news: News[])=>{
    //this.getNews().subscribe(news =>{
      this.news = news;
      this.news.sort((a, b) => (a.date > b.date ? -1 : 1));
      console.log(this.news);
    });
    this.getSuperUser().subscribe(response =>{
      //this.users = users;
      this.superuser = response;
      for (let object of this.superuser) {
        if (object.email == this.user.email) {
          this.userStatus = "superuser";
        }
        else {
          this.userStatus = "guest";
        }
      }
    })
  }
getSuperUser(){
    return this.firestore.collection("superusers").doc(this.user.email).valueChanges();
  }
getmonth(month){
    var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return months[month];
  }
checkURI(){
    var href = this.router.url;
    if(href.split('/').length!=3){
      this.router.navigate(["signin"]);
    }else{
      if(href.split('/')[2].length == 0){
        this.router.navigate(["signin"]);
      }else{
        this.countrySlug = href.split('/')[2];
        this.covidService.getCountry(this.countrySlug);
      }
    }
  }
addNews(){
    let news: News = {
      date: new Date(),
      description: this .description,
      username: this.user.displayName,
      uid:this.user.uid,
      country: ''
    };
    this.firestore.collection("news").doc("news").collection(this.countrySlug).add(news);
    this.description ="";
  }
getNews(){
    return this.firestore.collection("news").doc("news").collection(this.countrySlug).valueChanges();
  }
getSummaryData(country){
  console.log(country)
  return this.firestore.collection("summary").doc(country).valueChanges();
}
checkFireStore(){
  this.getSummaryData(this.countrySlug).subscribe((summary)=>{
    if(this.numberOfTimes==0){
    const today = new Date()
    if(summary == undefined){
        this.covidService.getAllCountriesData(this.countrySlug);
    }
    else{
      const lastUpdate = new Date(summary["date"])
      if(lastUpdate.getDate() == today.getDate() &&
      lastUpdate.getMonth() == today.getMonth() &&
      lastUpdate.getFullYear() == today.getFullYear()){
        this.cases = []; this.recovered = []; this.death = []
          this.cases = [{name:"Total Cases",value: +summary["TotalConfirmed"]},
                        {name: "New Cases", value: +summary["NewConfirmed"]}, 
                        {name: "Active Cases", value: (+summary["TotalConfirmed"])-(+summary["TotalRecovered"])}];
          this.recovered = [{name: "Total Recovered", value: +summary["TotalRecovered"]}, 
                            {name: "New Recovered", value: +summary["NewRecovered"]}, 
                            {name: "Recovery Rate", value: (+summary["TotalRecovered"])/(+summary["TotalConfirmed"])}];
          this.death = [{name: "Total Deaths", value: +summary["TotalDeaths"]}, 
                        {name: "New Deaths", value: +summary["NewDeaths"]}, 
                        {name: "Mortality Rate", value: (+summary["TotalDeaths"])/(+summary["TotalConfirmed"])}];
          this.resetPieChart([this.death[0].value,this.recovered[0].value,this.cases[0].value])
        
          console.log("Fetching data from firestore")
      }
      else{
        console.log("Updating Database")
        this.covidService.getAllCountriesData(this.countrySlug);
      }
    }
  }
    this.numberOfTimes +=1;
  }
  )
}
resetPieChart(data){
  this.pieChartData=data;
}
sortByName(array, key, direction){
  return array.sort(function(x, y){
   var a= x[key]; var b = y[key];
   if(direction)
   return ((a < b) ? -1 : ((a > b) ? 1 : 0));
   else
   return ((a > b) ? -1 : ((a < b) ? 1 : 0));
  });
 }

sortByValues(array, key, direction,index) {
 return array.sort(function(x, y){
  var a = x[key][index]; var b = y[key][index];
  if(direction)
  return ((a < b) ? -1 : ((a > b) ? 1 : 0));
   else
   return ((a > b) ? -1 : ((a < b) ? 1 : 0));
 });
}

sorting(direction,column){
  switch(column){
    case 'C':
      direction == 'up'? this.sortByName(this.countries,'name',1) : this.sortByName(this.countries,'name',0);
    break;
    case 'NC':
      direction == 'up'? this.sortByValues(this.countries,'values',1,0) : this.sortByValues(this.countries,'values',0,0);
    break;
    case 'TC':
      direction == 'up'? this.sortByValues(this.countries,'values',1,1) : this.sortByValues(this.countries,'values',0,1);
    break;
    case 'NR':
      direction == 'up'? this.sortByValues(this.countries,'values',1,2) : this.sortByValues(this.countries,'values',0,2);
    break;
    case 'TR':
      direction == 'up'? this.sortByValues(this.countries,'values',1,3) : this.sortByValues(this.countries,'values',0,3);
    break;
    case 'ND':
      direction == 'up'? this.sortByValues(this.countries,'values',1,4) : this.sortByValues(this.countries,'values',0,4);
    break;
    case 'TD':
      direction == 'up'? this.sortByValues(this.countries,'values',1,5) : this.sortByValues(this.countries,'values',0,5);
    break;
    }
  }
}


