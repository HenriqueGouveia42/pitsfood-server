declare namespace Express {
  //estamos sobrescrevendo a interface Request original
  //para permitir com que o Authmiddleware
  export interface Request {
    user: {
      id: string;
      role: string;
      store_id: string
    };
  }
}