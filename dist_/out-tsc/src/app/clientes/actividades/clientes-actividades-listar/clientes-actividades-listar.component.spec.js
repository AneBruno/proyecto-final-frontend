import { async, TestBed } from '@angular/core/testing';
import { ClientesActividadesListarComponent } from './clientes-actividades-listar.component';
describe('ClientesActividadesListarComponent', () => {
    let component;
    let fixture;
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ClientesActividadesListarComponent]
        })
            .compileComponents();
    }));
    beforeEach(() => {
        fixture = TestBed.createComponent(ClientesActividadesListarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
//# sourceMappingURL=clientes-actividades-listar.component.spec.js.map