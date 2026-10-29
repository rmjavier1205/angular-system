import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Issuers } from './issuers';

describe('Issuers', () => {
  let component: Issuers;
  let fixture: ComponentFixture<Issuers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Issuers],
    }).compileComponents();

    fixture = TestBed.createComponent(Issuers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
