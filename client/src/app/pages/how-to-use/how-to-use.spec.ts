import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HowToUse } from './how-to-use';

describe('HowToUse', () => {
  let component: HowToUse;
  let fixture: ComponentFixture<HowToUse>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HowToUse]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HowToUse);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
