export class Serv {
    public id:      string;
    public estilo:    string;
    public local:   string;
    public tipo:    string;
    public data:    string;
    public aval:    number;

    constructor(obj?: Partial<Serv>){
        if(obj){
            this.id     = obj.id
            this.estilo   = obj.estilo
            this.local  = obj.local
            this.tipo   = obj.tipo
            this.data   = obj.data
        }
    }

    toString() {
        const objeto = `{
            "id"    :   "${this.id}",
            "estilo"  :   "${this.estilo}",
            "local" :   "${this.local}",
            "tipo"  :   "${this.tipo}" ,
            "data"  :   "${this.data}"
        }`
        return objeto
    }

    toFirestore(){
        const serv = {
            id      : this.id,
            estilo    : this.estilo,
            local   : this.local,
            tipo    : this.tipo,
            data    : this.data
        }
        return serv
    }


}

