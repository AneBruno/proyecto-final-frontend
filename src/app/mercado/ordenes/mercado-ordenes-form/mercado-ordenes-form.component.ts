import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatAutocompleteSelectedEvent } from "@angular/material/autocomplete";
import { Router, ActivatedRoute } from "@angular/router";
import * as moment from "moment";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { UserService } from "src/app/auth/shared/services/user.service";
import { FormBaseLocalizacionComponent } from "src/app/shared/form-base-localizacion.component";
import { User } from "src/app/shared/models/user.model";



@Component({
  selector: 'app-mercado-ordenes-form',
  templateUrl: './mercado-ordenes-form.component.html',
  styleUrls: ['./mercado-ordenes-form.component.scss']
})
export class MercadoOrdenesFormComponent extends FormBaseLocalizacionComponent implements OnInit {
    @Input() accion?: string;
    @Input() id: number=0;
    @Input() mostrarBotones: boolean = true;

    @Output() datosGuardados = new EventEmitter<any>();
    @Output() formChange = new EventEmitter<any>();


    public productos                : any[] = [];
    public cosechas?               : any[];
    public condiciones_pago$?       : Observable<any[]>;
    public empresas                 : any[] = [];
    public puertos                  : any[] = [];
    public posicion                 : any;
    public consulta                 : boolean = false;
    public empresa_id?              : number;
    public campoVendedorModificado  : boolean = false;
    private empresa_id_to           : any;
    private producto_id_to          : any;
    public minDate                  : any = moment().format();
    public direccionCompletaDestino?: string;
    readonlyMode                    : boolean = false;
    public isLoading                : boolean = false;
    public currentUser?             : User;


    public constructor(
        private router: Router,
        private route: ActivatedRoute,
        private userService: UserService
    ) {
        super();
    }

    public ngOnInit(): void {
        this.currentUser = this.userService.getUser();
        this.watchInputs();
        this.createForm();
        this.loadRelatedData();
    }

    public async loadRelatedData() {
        this.buscarProductos();
        this.buscarEmpresas();
        this.condiciones_pago$ = this.apiService.getAllData('/mercado/condiciones-pago').pipe(
            map(condiciones => condiciones.filter((condicion: any) => condicion.habilitado))
        );
        this.cosechas         = await this.apiService.getAllData('/mercado/cosechas', {ordenes: {descripcion:'DESC'}, filtros: {habilitado: 1}}).toPromise();
        this.fetchPuertos();

        /*if (this.consulta) {
            this.form.disable();
        }*/
        if (this.consulta) {
            this.readonlyMode = true;
        }
        
    }

    private async watchInputs() {
        if (this.accion === 'consulta') {
            this.consulta = true;
            this.loadData();
        }
        else if (this.accion === 'copiar') {
            this.loadData();
        }
        else if (this.accion === 'agregar' && this.id!=0) {
            this.posicion = await this.apiService.getData(`/mercado/posiciones/${this.id}`).toPromise();
            //this.completarFormConPosicion();
        }
        this.obtenerYCompletar(this.id, {with_relation : 'cosecha'});
    }

    private loadData() {
        console.log("this.id", this.id);
        if (this.id!=0) {
            this.obtenerYCompletar(this.id, { with_relation: 'estado,empresa,producto,usuarioCarga' });
         
        }
    }

   /* private completarFormConPosicion() {
        this.form?.get('producto_id')?.setValue(this.posicion.producto_id);
        this.form?.get('producto_nombre')?.setValue(this.posicion.producto.nombre);
        this.form?.get('puerto_id')?.setValue(this.posicion.puerto_id);
        this.form?.get('moneda')?.setValue(this.posicion.moneda);
        this.form?.get('precio')?.setValue(this.posicion.precio);
        this.form?.get('condicion_pago_id')?.setValue(this.posicion.condicion_pago_id);
    }*/

    private createForm() {
        this.form = this.fb.group({
            id: new FormControl({ value: '', disabled: true }),
            producto_id: new FormControl({ value: '', disabled: false }),
            cosecha_id           : new FormControl({ value: '', disabled: false }),
            producto_nombre: new FormControl({ value: '', disabled: false }),
            empresa_id: new FormControl({ value: '', disabled: false }),
            puerto_id: new FormControl({ value: '', disabled: false }),
            volumen: new FormControl({ value: '', disabled: false }),
            moneda: new FormControl({ value: '', disabled: false }),
            precio: new FormControl({ value: '', disabled: false }),
            condicion_pago_id: new FormControl({ value: '', disabled: false }),
            estado_id: new FormControl({ value: '', disabled: false }),
            observaciones: new FormControl({ value: '', disabled: false }),
            empresa_razon_social: new FormControl({ value: '', disabled: false }),
            direccionCompletaDestino: new FormControl({ value: '', disabled: false })
        });

        this.form?.get('empresa_id')?.valueChanges.subscribe((value) => {
            this.empresa_id = value;
        });

        this.form.valueChanges.subscribe(value => {
            this.formChange.emit(value);
        });
    }

    protected get dataUrl(): string {
        return '/mercado/ordenes';
    }

    protected completarCampos(data: any) {
        super.completarCampos(data);
        this.form?.patchValue({ 'producto_nombre': data.producto.nombre });
        this.form?.patchValue({ 'empresa_razon_social': data.empresa.razon_social });
        var cosechaDeshabilitada = data.cosecha.habilitado ? false : true;
        if (this.consulta && cosechaDeshabilitada) {
            this.cosechas?.unshift(data.cosecha);
            //@ts-ignore
            this.form?.get('cosecha_id')?.setValue(this.cosechas[0].id);
        }
        if (!this.consulta && cosechaDeshabilitada) {
            this.form?.get('cosecha_id')?.setValue(null);
        } else {
            this.form?.get('cosecha_id')?.setValue(data.cosecha.id);
        }
       
        if (/*data.estado_id == 4 ||*/ data.estado_id == 5 || data.estado_id == 3) {
            this.form?.patchValue({ 'estado_id': "" });
        } else {
            this.form?.patchValue({ 'estado_id': data.estado_id });
        }
        
        this.form?.patchValue({ 'comercial': (data.usuario_carga.nombreCompleto) });

        //Lógica para completar campos de destino:
        if (data.puerto_id !== null) {
            this.form?.patchValue({ 'puerto_id': data.puerto_id });

        } else {
            this.direccionCompletaDestino = data.localidad_destino + ', ' + data.departamento_destino + ', ' + data.provincia_destino;
        }
    }

    protected getFormData(): any {
        let formData = super.getFormData();
        return formData;
    }

    public guardar() {
        this.isLoading = true;
        if (this.accion === 'copiar' || this.accion === 'agregar') {
            this.id = 0;
        }
        // Obtener el valor del campo de entrada y reemplazar comas por puntos.
        const volumen = this.form?.get('volumen')?.value.replace(',', '.');

        // Asignar el valor transformado de vuelta al campo de entrada.
        this.form?.get('volumen')?.setValue(volumen);

        this.enviarDatos().subscribe((data: any) => {
            this.isLoading = false;
            this.messages.show('Datos guardados correctamente').subscribe(() => {
                this.datosGuardados.emit();
            });
        });
        this.isLoading = false;
    }

    public empresa_id_keyup(ev: any) {
        if (this.empresa_id_to) {
            clearTimeout(this.empresa_id_to);
        }
        this.empresa_id_to = setTimeout(() => {
            this.buscarEmpresas(ev.target.value);
        }, 400);
    }

    public empresa_id_selected(ev: MatAutocompleteSelectedEvent) {
        let id = ev.option._getHostElement().getAttribute('data-id');
        this.form?.patchValue({ empresa_id: id });
    }

    public buscarEmpresas(busqueda?: any) {
        if(this.currentUser?.rol_id != 4){
            let filtros: any = {};
            filtros.perfil = "VENDEDOR";
            if (busqueda) {
                filtros.busqueda = busqueda;
            }
            this.apiService.getData('/clientes/empresas', {
                filtros: filtros,
                ordenes: {
                    razon_social: 'ASC'
                }
            }).subscribe(data => {
                this.empresas = data;
            });
        }else {
            let filtros: any = {};
            filtros.perfil = "VENDEDOR";
            filtros.usuario_comercial_id = this.currentUser.id;
            if (busqueda) {
                filtros.busqueda = busqueda;
            }
            this.apiService.getData('/clientes/empresas', {
                filtros: filtros,
                ordenes: {
                    razon_social: 'ASC'
                }
            }).subscribe(data => {
                this.empresas = data;
            });
        }
        
    }

    public producto_id_selected(ev: MatAutocompleteSelectedEvent) {
        let id = ev.option._getHostElement().getAttribute('data-id');
        this.form?.patchValue({ producto_id: id });
    }

    public producto_id_keyup(ev: any) {
        if (this.producto_id_to) {
            clearTimeout(this.producto_id_to);
        }
        this.producto_id_to = setTimeout(() => {
            this.buscarProductos(ev.target.value);
        }, 400);
    }

   
    public buscarProductos(busqueda?: any) {
        let filtros: any = {};
        if (busqueda) {
            filtros.busqueda = busqueda;
        }
        this.apiService.getData('/productos', {
            limit: 20,
            filtros: filtros,
            ordenes: {
                uso_frecuente: 'DESC',
                nombre: 'ASC'
            }
        }).subscribe(data => {
            this.productos = data;
        });
    }

    private fetchPuertos() {
        let filtros: any = {};
        if (this.consulta) {
            filtros.estado = 'todos';
        }
        this.apiService.getData('/puertos', {
            limit: 0,
            filtros: filtros
        }).subscribe(data => {
            this.puertos = data;
        });

    }

}
