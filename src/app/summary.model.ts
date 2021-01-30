export class Summary{
  date: any;
  TotalConfirmed: string;
  NewConfirmed: string;
  TotalRecovered: string;
  NewRecovered: string;
  TotalDeaths: string;
  NewDeaths: string;


  constructor(  date: string, TotalConfirmed: string, NewConfirmed: string, TotalRecovered: string, NewRecovered: string, TotalDeaths: string, NewDeaths: string){
      this.date = date;
      this.TotalConfirmed = TotalConfirmed;
      this.NewConfirmed = NewConfirmed;
      this.TotalRecovered = TotalRecovered;
      this.NewRecovered = NewRecovered;
      this.TotalDeaths = TotalDeaths;
      this.NewDeaths = NewDeaths;

  }
}