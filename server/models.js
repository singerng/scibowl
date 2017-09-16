const mongoose = require('mongoose');
mongoose.set('debug', true);
const passportLocalMongoose = require("passport-local-mongoose");

const Schema = mongoose.Schema;
const Types = Schema.Types;

const game = require('./game');
const validate = require('./validate');

const roles = { user: 1, staff: 2, superuser: 3 };


/** Defines a user class for use throughout the site.
 *
 * Note that Permissions should refer to the string dictionary in the
 * permission file.
 */
const userSchema = new Schema({
  username  : { type: Types.String, required: true },
  password  : { type: Types.String, required: true },
  name      : {
    first   : { type: Types.String, required: true },
    last    : { type: Types.String, required: true },
  },
  email     : { type: Types.String, required: true },
  role      : { type: Types.Number, default: 1 },  // TODO: validate
});

/** Connect to the passport. */
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);


/** Shared characteristics of all Science Bowl questions.
 *
 * This is the base class for the multiple choice and short answer
 * questions.
 */
const questionSchema = new Schema({
  author       : { type: Types.ObjectId, ref: 'User' },
  text         : { type: Types.String, required: true },
  subject      : { type: Types.String, enum: game.SUBJECTS, required: true },
  bonus        : { type: Types.ObjectId, ref: 'Question' },
  difficulty   : { type: Types.Number },
  visibility   : { type: Types.Number, enum: game.VISIBILITY, required: true, default: 1 }
}, { discriminatorKey: 'kind' });
const Question = mongoose.model('Question', questionSchema);


/** Model defining multiple choice questions.
 *
 * The choices field must contain a list of anonymous models each with
 * a choice and text attribute. The choice corresponds to one of the
 * four letter options, and the text corresponds to the actual
 * response.
 */
const choiceSchema = new Schema({
  choice:   { type: Types.String, enum: game.CHOICES, required: true },
  text:     { type: Types.String, required: true }
});

const multipleChoiceQuestionSchema = new Schema({
  choices   : { type: [ choiceSchema ], required: true },
  answer    : { type: Types.String, enum: game.CHOICES, required: true }
});

/** Update a multiple choice question from response data. */
multipleChoiceQuestionSchema.methods.update = function(data) {
  this.subject = data['subject'] || this.subject;
  this.text = data['text'] || this.text;
  this.choices = data['choices'] || this.choices;  // Todo: actually implement error checking
  this.answer = data['answer'] || this.answer;
};

const MultipleChoiceQuestion = Question.discriminator('MultipleChoiceQuestion', multipleChoiceQuestionSchema);


/** Short answer question model.
 *
 * The only extra part to a short answer question model is the open
 * ended answer field, which accepts any string.
 */
const shortAnswerQuestionSchema = new Schema({
  answer   : { type: Types.String, required: true }
});

/** Update a short answer question from response data. */
shortAnswerQuestionSchema.methods.update = function(data) {
  this.subject = data['subject'] || this.subject;
  this.text = data['text'] || this.text;
  this.answer = data['answer'] || this.answer;
};

const ShortAnswerQuestion = Question.discriminator('ShortAnswerQuestion', shortAnswerQuestionSchema);


// Rounds
const roundSchema = new Schema({
  owner        : { type: Types.ObjectId, ref: 'User' },
  questions    : [{ type: Types.ObjectId, ref: 'Question', required: true }],
  permission   : { type: Types.Number, enum: game.PERMISSIONS, required: true, default: 1 }
}, { discriminatorKey: 'kind '});
const Round = mongoose.model('Round', roundSchema);


// Tryouts
const tryoutQuestionSchema = new Schema({
  question   : { type: Types.ObjectId, ref: 'MultipleChoiceQuestion', required: true },
  time       : { type: Types.Number, required: true }
});

const tryoutSchema = new Schema({
  start        : { type: Types.Date, required: true },
  end          : { type: Types.Date, required: true },
  questions:   [ tryoutQuestionSchema ]
});
const Tryout = Round.discriminator('Tryout', tryoutSchema);


// Tryout question result
const tryoutQuestionResultStatus = ['correct', 'incorrect', 'skipped', 'current'];
const tryoutQuestionResultSchema = new Schema({
  question:   { type: Schema.Types.ObjectId, ref: 'MultipleChoiceQuestion', required: true },
  released:   { type: Schema.Types.Date, required: true },
  status:     { type: Schema.Types.String, enum: tryoutQuestionResultStatus }
});


// Tryout round result
const tryoutResultsSchema = new Schema({
  tryout:      { type: Schema.Types.ObjectId, ref: 'Tryout', required: true },
  user:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  questions:   { type: [ tryoutQuestionResultSchema ], default: [] },
});
const TryoutResults = mongoose.model('TryoutResults', tryoutResultsSchema);


module.exports = {
  roles: roles,
  User: User,
  Question: Question,
  MultipleChoiceQuestion: MultipleChoiceQuestion,
  ShortAnswerQuestion: ShortAnswerQuestion,
  Round: Round,
  Tryout: Tryout,
  TryoutResults: TryoutResults
};
