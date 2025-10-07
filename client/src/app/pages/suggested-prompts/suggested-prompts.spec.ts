import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuggestedPrompts } from './suggested-prompts';

describe('SuggestedPrompts', () => {
  let component: SuggestedPrompts;
  let fixture: ComponentFixture<SuggestedPrompts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuggestedPrompts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuggestedPrompts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
