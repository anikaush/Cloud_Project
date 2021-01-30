export class News{
    date: any;
    uid: string;
    username:string;
    description: string;
    country: string;
  
    constructor(  
        date: Date,
        uid: string,
        username:string,
        description: string,
        country: string){
        this.date = date;
        this.uid = uid;
        this.username = username;
        this.description = description;
        this.country = country;
        
    }
  }
  export class WorldsNews {
    uid: string;
    Content: string;
    Date: Date;
  }
  