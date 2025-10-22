import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-suggested-prompts',
  imports: [CommonModule],
  templateUrl: './suggested-prompts.html',
  styleUrl: './suggested-prompts.css'
})
export class SuggestedPrompts {
  prompts = [
    'Explain a complex topic simply',
    'Summarize this paragraph',
    'Write an email to my boss',
    'Generate a workout plan',
    'Translate this sentence',
    'Debug my code snippet',
    'Write a poem about autumn',
    'Suggest startup ideas',
    'Create a to-do list for productivity',
    'Give me meal prep ideas for the week'
  ];

  constructor(
    private router: Router,
    private titleService: Title
  ) {}

  usePrompt(prompt: string) {
    this.router.navigate(['/chat'], { queryParams: { prompt } });
  }

  ngOnInit(): void {
    this.titleService.setTitle('Suggested prompts – AI Chat Service');
  }
}
