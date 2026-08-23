import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobsFiltersComponent } from './jobs-filters.component';

describe('JobsFiltersComponent', () => {
  let component: JobsFiltersComponent;
  let fixture: ComponentFixture<JobsFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobsFiltersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobsFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
