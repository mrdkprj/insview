import AzureStoreBase from "./azureStoreBase"
import session from "express-session"

export default function azureStoreFactory(Store:typeof session.Store){

    class AzureStore extends Store{

        azureStoreBase: AzureStoreBase

        constructor(options:any){

            super(options)

            this.azureStoreBase = new AzureStoreBase(options);

        }

        get (sid: string, callback: (err: any, session?: session.SessionData | null) => void){
            this.azureStoreBase.get(sid)
            .then((data:any) => {
                callback(null, data)
            })
            .catch(callback)
        }

        set (
            sid: string,
            session: session.SessionData,
            callback?: (err?: any) => void
          ) {
            this.azureStoreBase
              .set(sid, session)
              .then(callback)
              .catch(callback)
          }

          destroy (sid: string, callback?: (err?: any) => void) {
            this.azureStoreBase
              .destroy(sid)
              .then(callback)
              .catch(callback)
          }
    }

    return AzureStore;
}
