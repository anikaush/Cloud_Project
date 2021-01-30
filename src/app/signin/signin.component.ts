import { CovidService } from '../covid.service';
import { User } from '../user.model';
import { News, WorldsNews } from '../news.model';
import { Summary } from '../summary.model';
import { Component, OnInit } from '@angular/core';
import { AngularFirestore, DocumentData } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import { Color, Label, SingleDataSet,monkeyPatchChartJsLegend, monkeyPatchChartJsTooltip } from 'ng2-charts';
import { Subscription } from 'rxjs';
import {MatSelectModule} from '@angular/material/select';


@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit {
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
  public lineChartData: ChartDataSets[] = []; //for total deaths, recoveries, cases
  public lineChartLabels: Label[] = []; //for months
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
  countries: {name: String, values: number[]}[] =[]
  countriesAdded: {name: String, values: number[]}[]
  tableCountriesHead = ["New Cases","Total Cases",
                        "New Recoveries",
                        "Total Recoveries",
                        "New Deaths",
                        "Total Deaths"];
  summarySubscription: Subscription;
  summaryTillTodaySubscription: Subscription;
  summaryOf7daysSubscription: Subscription;
  countriesSubscription: Subscription;
  summary: Summary;
  superuser: Array<Object> | any;
  userStatus = new String;
  numberOfTimes = 0;
  numberOfTimes2 = 0;
  newsOfCountry = 'world';
  news : News[]=[];
  users: string[]=[];

  constructor(public covidService:CovidService, private router: Router, private firestore: AngularFirestore) {
    monkeyPatchChartJsTooltip();
    monkeyPatchChartJsLegend();
   }

  ngOnInit(): void {
    this.user = this.covidService.getUser();
    this.countriesSubscription = this.covidService.countriesSubject.subscribe(
      (data: {name: string, values:number[]}[]) => {
        this.countries = data;
      }
    )
   this.summarySubscription = this.covidService.summarySubject.subscribe(
      (data: number[]) => {
        if(data.length > 0){
          this.cases = []; this.recovered = []; this.death = []
          this.cases = [{name:"Total Cases",value:data[0]}, 
                        {name: "New Cases", value: data[1]}, 
                        {name: "Active Cases", value: data[2]}];
          this.recovered = [{name: "Total Recovered", value: data[3]}, 
                            {name: "New Recovered", value: data[4]}, 
                            {name: "Recovery Rate", value: data[5]}];
          this.death = [{name: "Total Deaths", value: data[6]}, 
                        {name: "New Deaths", value: data[7]},
                        {name: "Mortality Rate", value: data[8]}];
          
          this.resetPieChart([data[6], data[3], data[2]])     //Pie Chart
          
          let newSummary : Summary = {                        //Database update
            date:new Date().toString(),
            TotalConfirmed: data[0].toString(),
            NewConfirmed: data[1].toString(),
            TotalRecovered: data[3].toString(),
            NewRecovered: data[4].toString(),
            TotalDeaths: data[6].toString(),
            NewDeaths: data[7].toString()
          }
          console.log("Storing data in firestore")
          if(this.numberOfTimes2==0){
           console.log('world')
            this.firestore.collection("summary").doc("world").set(newSummary);
           this.numberOfTimes2++;}
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
          this.lineChartLabels.push(i.toString());
        }
        this.lineChartData = [
          { data: dataFrom[0], label: 'Total Deaths' },
          { data: dataFrom[1], label: 'Total Recovered' },
          { data: dataFrom[2], label: 'Total Cases' }
        ];
    }
    );

    this.covidService.getAllCountries();
    
    this.barChartLabels = [];                              //Bar graph of 7 days
    var z = new Date();
    for (var i = 0; i < 7; i++) {
      this.barChartLabels.unshift(z.getDate()+' '+z.toLocaleString('en-us', { month: 'short' }));
      if(i == 6)
      continue;
      z.setDate(z.getDate()-1);
    }

    this.getSummaryData("world").subscribe((summary)=>{
      if(this.numberOfTimes==0){
      const today = new Date()
      if(summary == undefined){
          console.log("update required")                     //updating database
          this.covidService.getSummary();
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
          console.log("updating database")
          this.covidService.getSummary();
        }
      }
    }
      this.numberOfTimes +=1;
    }
    )
    var day1 = (z.toISOString().slice(0,10));
    var day7 = (new Date()).toISOString().slice(0,10);
    this.covidService.getSummaryOf7days(day1, day7);
    this.covidService.getSummaryTillToday();
    //this.getNews().subscribe(news=>{
      this.getNews().subscribe((news: News[])=>{
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

getSummaryData(country){
  return this.firestore.collection("summary").doc(country).valueChanges();
}
resetPieChart(data){
  this.pieChartData=data;
}
changeNewsCountry(country){
this.newsOfCountry = country;
}
addNews(){
  let news: News = {
    date: new Date(),
    description: this .description,
    username: this.user.displayName,
    uid:this.user.uid,
    country: this.newsOfCountry
  };
  this.firestore.collection("news").doc("news").collection(this.newsOfCountry).add(news);
  this.description ="";
}
getNews(){
  return this.firestore.collection("news").doc("news").collection("world").valueChanges();
}
getSuperUser(){
  return this.firestore.collection("users").doc("superusers").collection("userinfo").valueChanges();
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
   return array.sort(function(a, b){
   var x = a[key][index]; var y = b[key][index];
   if(direction)
   return ((x < y) ? -1 : ((x > y) ? 1 : 0));
   else
   return ((x > y) ? -1 : ((x < y) ? 1 : 0));
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
goToCountry(country){
  this.router.navigate(["countrywise/"+country]);
  }
}
