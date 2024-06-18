import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PokedexInstructionDialogComponent } from './pokedex-instruction-dialog.component';

describe('PokedexInstructionDialogComponent', () => {
  let component: PokedexInstructionDialogComponent;
  let fixture: ComponentFixture<PokedexInstructionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PokedexInstructionDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PokedexInstructionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
