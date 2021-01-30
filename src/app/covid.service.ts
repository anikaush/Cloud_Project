import { Injectable } from '@angular/core';
import  firebase  from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { User } from './user.model';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CovidService {

  private user: User;
  summary: number[]=[];
  eachCountriesData: {name: string, values:number[]}[] = [];
  countrySubject = new Subject<string[]>();
  summaryOf7days : number[][] = [[],[],[]];
  summaryTillToday : number[][]= [[],[],[],[]];
  summarySubject = new Subject<number[]>();
  summaryOf7daysSubject = new Subject<number[][]>();
  summaryCountrySubject = new Subject<{name: string, values:number[]}>();
  summaryTillTodaySubject = new Subject<number[][]>();
  countriesSubject = new Subject<{name: string, values:number[]}[]>();

  constructor(private afAuth: AngularFireAuth, 
    private router: Router,
    private firestore: AngularFirestore,
    private httpClient: HttpClient) {
      
   }

  async signInWithGoogle(){
    const credentials = await this.afAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider)
    this.user = {
      uid: credentials.user?.uid!,
      displayName: credentials.user?.displayName!,
      email: credentials.user?.email!
    };
    localStorage.setItem("user",JSON.stringify(this.user));
    this.updateUserData();
    this.router.navigate(["countrywise"]);
  }
  private updateUserData(){
    this.firestore.collection("users").doc(this.user.uid).set({
       uid: this.user.uid,
       displayName: this.user.displayName,
       email: this.user.email
    }, { merge: true});
  }
  getUser(){
    if(this.user == null && this.userSignedIn()){
      this.user = JSON.parse(localStorage.getItem("user"));
    }
    return this.user;
  }

  userSignedIn(): boolean {
    return JSON.parse(localStorage.getItem("user")) != null;
  }

  public signOut(){
    this.afAuth.signOut();
    localStorage.removeItem("user");
    this.user = null;
    this.router.navigate(["signin"]);
  }
  
  public getSummary(country='all'){
    this.summary = [];
    console.log(country)
    this.httpClient.get<any>('https://api.covid19api.com/summary').subscribe(
      (response) => {
        this.summary[0]=response["Global"]["TotalConfirmed"];
        this.summary[1]=response["Global"]["NewConfirmed"];
        this.summary[3]=response["Global"]["TotalRecovered"];
        this.summary[4]=response["Global"]["NewRecovered"];
        this.summary[5]=this.summary[3]/this.summary[0]; //New Recovered
        this.summary[6]=response["Global"]["TotalDeaths"];
        this.summary[7]=response["Global"]["NewDeaths"];
        this.summary[8]=this.summary[6]/this.summary[0]; //Mortality Rate
        this.summary[2]=this.summary[0]-this.summary[3]; //Active Cases
        this.summarySubject.next(this.summary);
          return;
      }
    );
  }
  public getAllCountries(){
    this.eachCountriesData = []
    this.httpClient.get<any>('https://api.covid19api.com/summary').subscribe(
      response => {
        for (const country of response["Countries"]){
          this.eachCountriesData.push({name: country["Country"], values:[country["NewConfirmed"],country["TotalConfirmed"],country["NewRecovered"],country["TotalRecovered"],country["NewDeaths"],country["TotalDeaths"],country["Slug"]]});
        }
        this.countriesSubject.next(this.eachCountriesData);
      }
    );
  }
  public getAllCountriesData(country='all'){
    this.summary = [];
    console.log(country)
    this.httpClient.get<any>('https://api.covid19api.com/summary').subscribe(
      response => {
          for (const allCountriesData of response["Countries"]){
            if(allCountriesData["Slug"] == country){
              this.summary[0]=allCountriesData["TotalConfirmed"];
              this.summary[1]=allCountriesData["NewConfirmed"];
              this.summary[3]=allCountriesData["TotalRecovered"];
              this.summary[4]=allCountriesData["NewRecovered"];
              this.summary[5]=this.summary[3]/this.summary[0]; //New Recovered
              this.summary[6]=allCountriesData["TotalDeaths"];
              this.summary[7]=allCountriesData["NewDeaths"];
              this.summary[8]=this.summary[6]/this.summary[0]; //Mortality Rate
              this.summary[2]=this.summary[0]-this.summary[3]; //Active Cases
              console.log(this.summary);
              this.summaryCountrySubject.next({name:country, values: this.summary});
              return;
            }
          }
        }
    );
  }
  sortByName(array: any,key: any){
    return array.sort(function (x:any, y:any){
      var a = x[key]; var b = y[key];
      return((a<b) ?-1:((a>b)?1:0));
    });
  }
 public getCountry(countrySlug: string){
   this.httpClient.get<any>('https://api.covid19api.com/countries').subscribe(
      response => {
        console.log(response)
        for (const countries of response){
          if(countries["Slug"] == countrySlug){
            this.countrySubject.next([countries["Country"],countries["ISO2"]]);
            return;
          }
        }
        this.router.navigate(["signin"]);
        return;
      });
  }
  public getSummaryOf7days(day1:any,day7:any, countrySlug='all'){
    this.summaryOf7days = [[],[],[]];
    if(countrySlug=='all'){
    //this.httpClient.get<any[]>('https://api.covid19api.com/' + '/world?from=' + day1 + '&to=' + day7).subscribe(
    this.httpClient.get<any>('https://corona.lmao.ninja/v2/historical/all?lastdays=8').subscribe(
      response => {
        if(response!=null){
          this.sortByName(response,"TotalConfirmed");
          for (const x of response){
            this.summaryOf7days[0].push(x["cases"]);
            this.summaryOf7days[1].push(x["deaths"]);
            this.summaryOf7days[2].push(x["recovered"]);
            }
            this.summaryOf7daysSubject.next(this.summaryOf7days);
            return;
          }
        });
      }
  }
  public getSummaryTillToday(countrySlug='all', day1 = '2020-04-13'){
    this.summaryTillToday[0]=[];
    this.summaryTillToday[1]=[];
    this.summaryTillToday[2]=[];
    this.summaryTillToday[3]=[];
    var today = (new Date()).toISOString().slice(0,10)
    if(countrySlug == 'all'){
      //this.httpClient.get<any[]>('https://api.covid19api.com/' + '/world?from=' + day1 + '&to=' + today).subscribe(
      this.httpClient.get<any[]>('https://corona.lmao.ninja/v2/historical/all?from=' + day1 + '&to=' + today).subscribe(
          (response) => {
            this.sortByName(response,"TotalConfirmed");
            for (const summary of response){
              this.summaryTillToday[0].push(summary["TotalDeaths"]);
              this.summaryTillToday[1].push(summary["TotalRecovered"]);
              this.summaryTillToday[2].push(summary["TotalConfirmed"]);
            }
            this.summaryTillTodaySubject.next(this.summaryTillToday);
            return;
          });
        }
  }
  getNews(){
    return this.firestore.collection("news").doc("world").collection("news").valueChanges();
  }
}
