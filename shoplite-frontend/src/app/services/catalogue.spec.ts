import { TestBed } from '@angular/core/testing';

import { Catalogue } from './catalogue';

describe('Catalogue', () => {
  let service: Catalogue;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Catalogue);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
