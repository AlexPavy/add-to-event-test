import { Injectable } from '@nestjs/common';
import {Firestore} from '@google-cloud/firestore';

@Injectable()
export class FirestoreSvc {

  public db;

  constructor() {
    this.db = new Firestore({
      projectId: 'codetests',
      keyFilename: 'google-credentials.json',
    });
  }

}
