/*
 * Validation of form entries (= submissions).
 * It loads the corresponding form definition from firestore
 */
import {
    PipeTransform,
    Injectable,
    ArgumentMetadata,
    BadRequestException
} from '@nestjs/common';
import {FormDefinitionSvc} from "./formDefinition.service";

const Joi = require('@hapi/joi');

const FORM_ENTRY_SCHEMA = Joi.object({
    key: Joi.string().required(),
    name: Joi.string().required(),
    dateCreated: Joi.date().timestamp().required(),
    date: Joi.date().timestamp().required(), // I suppose it could be generated on the server side
    serviceKey: Joi.string().required(),
    questions: Joi.array().items(
        Joi.object({
            questionKey: Joi.string().required(),
            value: Joi.string().required(), // I put string to simplify
        })
    ).min(2).required(),
});

@Injectable()
export class FormEntryValidationPipe implements PipeTransform {
    constructor(private readonly formDefSvc: FormDefinitionSvc) {}

    transform(value: any, metadata: ArgumentMetadata) {
        const result = FORM_ENTRY_SCHEMA.validate(value);
        if (result.error) {
            throw new BadRequestException(result.error.stack);
        }

        const formDef = this.formDefSvc.get(value.serviceKey);
        if (!formDef) {
            throw new BadRequestException(
                `There is no definition of service with serviceKey ${value.serviceKey}`);
        }

        this.validateQuestions(value.questions, formDef);

        return value;
    }

    /**
     * Validate based on form definition
     */
    validateQuestions(questions, formDef) {
        const defByKey = {};
        for (let q of formDef) {
            defByKey[q.key] = q
        }

        for (let a of questions) {
            if (!defByKey[a.questionKey]) {
                throw new BadRequestException(
                    `There is no question with key ${a.questionKey} in the service definition`);
            }

            const def = defByKey[a.questionKey];
            if (a.value.length > def.validation.maxLength) {
                throw new BadRequestException(
                    `Value for ${a.questionKey} cannot be longer than ${def.validation.maxLength}`);
            }

            if (!new RegExp(def.validation.pattern).test(a.value)) {
                throw new BadRequestException(def.validation.validationMessage);
            }

            // delete question to track unanswered questions
            delete defByKey[a.questionKey]
        }

        // check missing required questions
        for (let k in defByKey) {
            if (defByKey[k].validation.required) {
                throw new BadRequestException(
                    `A response for ${k}:${defByKey[k].title} is required`);
            }
        }
    }

}
