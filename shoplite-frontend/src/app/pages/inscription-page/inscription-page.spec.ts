import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InscriptionPage } from './inscription-page';

describe('InscriptionPage', () => {
  let component: InscriptionPage;
  let fixture: ComponentFixture<InscriptionPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InscriptionPage],
    }).compileComponents();

    fixture = TestBed.createComponent(InscriptionPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
