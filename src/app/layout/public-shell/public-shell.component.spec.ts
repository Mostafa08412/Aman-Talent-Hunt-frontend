import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicShellComponent } from './public-shell.component';

describe('PublicShellComponent', () => {
  let component: PublicShellComponent;
  let fixture: ComponentFixture<PublicShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicShellComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
