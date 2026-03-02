export class Prest {
    public id:      string;
    public nome:    string;
    public email:   string;
    public fone:    string;
    public datanascimento:Date;  
    public cnpj: string;  

    constructor(obj?: Partial<Prest>){
        if(obj){
            this.id     = obj.id
            this.nome   = obj.nome
            this.email  = obj.email
            this.fone   = obj.fone
            this.datanascimento   = obj.datanascimento
            this.cnpj = obj.cnpj
        }
    }

    toString() {
        const objeto = `{
            "id"    :   "${this.id}",
            "nome"  :   "${this.nome}",
            "email" :   "${this.email}",
            "fone"  :   "${this.fone}",
            "datanascimento"  :   "${this.datanascimento}",
            "cnpj" : "${this.cnpj}"
        }`
        return objeto
    }

    toFirestore(){
        const prest = {
            id      : this.id,
            nome    : this.nome,
            email   : this.email,
            fone    : this.fone,
            datanascimento    : this.datanascimento,
            cnpj : this.cnpj,
        }
        return prest
    }


}