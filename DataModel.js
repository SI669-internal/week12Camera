import { initializeApp, getApps } from 'firebase/app';
import { 
  initializeFirestore, setDoc, getDoc, collection
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseConfig } from './Secrets';

import * as FileSystem from 'expo-file-system';

let app;
if (getApps().length == 0){
  app = initializeApp(firebaseConfig);
} 
const storage = getStorage(app);

class DataModel {
  constructor() {
    this.theImage = undefined; // the one and only image in the app
    this.theCallback = undefined; // a callback so that MainScreen can be notified
    this.currentPhotoRef = ref(storage, 'images/currentPhoto.jpg');
    
    const setupDownloadURL = async () => {
      this.downloadURL = await getDownloadURL(this.currentPhotoRef);
      console.log(this.downloadURL);
      this.theImage = {uri: this.downloadURL};
      if (this.theCallback) {
        console.log('calling back, image gotted');
        this.theCallback(this.theImage);
      }
    }
    setupDownloadURL();
  }

  // this will allow the MainScreen to be notified when a new image is ready
  subscribeToImageUpdate = (callback) => {
    this.theCallback = callback;
  }

  // this will allow the CameraScreen to update the image
  updateImage = async (imageObject) => {
    
    try {
      // fetch the image object from the local filesystem
      const response = await fetch(imageObject.uri);
      const imageBlob = await response.blob();

      // then upload it to Firebase Storage
      await uploadBytes(this.currentPhotoRef, imageBlob);
    } catch(e) {
      console.log(e);
    } finally {
      console.log('finally');
    }

    // now update our in-app variables
    this.theImage = imageObject;

    // and update listeners
    if (this.theCallback) {
      this.theCallback(imageObject);
    }
  }
}

// the singleton pattern, same as before
let theDataModel = undefined;
export function getDataModel() {
  if (!theDataModel) {
    theDataModel = new DataModel();
  }
  return theDataModel;
}