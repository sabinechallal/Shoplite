import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnexionPage } from './connexion-page';

describe('ConnexionPage', () => {
  let component: ConnexionPage;
  let fixture: ComponentFixture<ConnexionPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConnexionPage],
    }).compileComponents();

    fixture = TestBed.createComponent(ConnexionPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
