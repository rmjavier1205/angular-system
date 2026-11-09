import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyAssignedEquipment } from './my-assigned-equipment';

describe('MyAssignedEquipment', () => {
  let component: MyAssignedEquipment;
  let fixture: ComponentFixture<MyAssignedEquipment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyAssignedEquipment],
    }).compileComponents();

    fixture = TestBed.createComponent(MyAssignedEquipment);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
