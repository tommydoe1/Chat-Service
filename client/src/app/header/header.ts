import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  @Output() toggle = new EventEmitter<void>();

  onToggleClick() {
    this.toggle.emit();
  }

}
