import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CountrywiseComponent } from './countrywise.component';

describe('CountrywiseComponent', () => {
  let component: CountrywiseComponent;
  let fixture: ComponentFixture<CountrywiseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CountrywiseComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CountrywiseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
