import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-how-to-use',
  imports: [],
  templateUrl: './how-to-use.html',
  styleUrl: './how-to-use.css'
})
export class HowToUse {

  constructor(
    private titleService: Title
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('How to use – AI Chat Service');
  }

}
