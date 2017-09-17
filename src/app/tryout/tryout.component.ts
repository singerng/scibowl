import { Component, AfterViewInit } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

import { CHOICES, SUBJECT_DISPLAY } from '../game';


@Component({
  selector: 'sb-tryout',
  templateUrl: './tryout.component.html'
})
export class TryoutComponent implements AfterViewInit {
  // Constants
  CHOICES = CHOICES;
  SUBJECT_DISPLAY = SUBJECT_DISPLAY;

  // Whether the user has agreed to the conditions
  agreed: Boolean = false;
  // Whether the tryout has started
  started: Boolean = false;
  // Whether the current question can still be answered
  answerable: Boolean = false;
  // Whether the current question has stopped (either time expired or it was skipped)
  stopped: Boolean = false;
  // Whether the tryout has ended
  ended: Boolean = false;

  // Current question
  question: any;
  // Current answer choice (updated in form)
  answerChoice: String = '';

  // Current fraction of the progress bar that should be shaded
  timeFraction: number;

  constructor(private http: Http) { }

  ngAfterViewInit() {
    // Setup timer to continuously update question time
    window.onload = () => this.startTimer();
    if (document.readyState === 'complete') {
      this.startTimer();
    }
  }

  startTimer() {
    window.setInterval(() => this.tick(), 100);
  }

  tick() {
    // The question can no longer be answered if time has expired
    if (this.started && !this.ended) {
      // Update the progress bar while the question is answerable
      if (this.answerable) {
        this.timeFraction = (Date.now() - this.question.released) / this.question.time / 1000;
      }

      // Make the question unanswerable when the time elapses
      if (this.timeFraction >= 1) {
        this.answerable = false;
      }
    }
  }

  nextQuestion() {
    this.http.post('/api/tryout/next', { }).subscribe(res => {
      if (res.status === 200) {
        this.started = true;

        // Reset question
        this.answerable = true;
        this.stopped = false;
        this.answerChoice = '';

        // Populate question
        this.question = res.json();
        this.question.released = new Date(this.question.released).getTime();
        this.timeFraction = 0;
      } else if (res.status === 204) {
        this.ended = true;
      }
    });
  }

  skip() {
    this.http.post('/api/tryout/skip', { }).subscribe(() => { this.stopped = true; this.answerable = false; });
  }

  submit() {
    this.http.post('/api/tryout/submit', { answer: this.answerChoice }).subscribe(() => { this.stopped = true; this.answerable = false; });
  }
}
