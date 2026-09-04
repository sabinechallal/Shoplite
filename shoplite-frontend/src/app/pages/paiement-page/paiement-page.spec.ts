import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaiementPage } from './paiement-page';

describe('PaiementPage', () => {
  let component: PaiementPage;
  let fixture: ComponentFixture<PaiementPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaiementPage],
    }).compileComponents();

    fixture = TestBed.createComponent(PaiementPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
