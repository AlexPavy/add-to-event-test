import {BadRequestException, Injectable} from '@nestjs/common';
import {FirestoreSvc} from "./firestore";

@Injectable()
export class FormDefinitionSvc {

  private formDefDb;

  constructor(private readonly firestoreSvc: FirestoreSvc) {
    this.formDefDb = firestoreSvc.db.collection('form_definitions');
  }

  async get(name: string) {
     const snap = await this.formDefDb.doc(name).get();
     return snap.data();
  }

  async create(serviceKey: string, data) {
    const snap = await this.formDefDb.doc(serviceKey).get();
    if (snap.data()) {
      throw new BadRequestException(`Service key ${serviceKey} already exists`);
    }
    return this.formDefDb.doc(serviceKey).set(data);
  }

  async update(serviceKey: string, data) {
    const snap = await this.formDefDb.doc(serviceKey).get();
    if (!snap.data()) {
      throw new BadRequestException(`Service name ${serviceKey} doesn't exist`);
    }
    return this.formDefDb.doc(serviceKey).set(data);
  }

  async delete(name: string) {
    return this.formDefDb.doc(name).delete();
  }
}
