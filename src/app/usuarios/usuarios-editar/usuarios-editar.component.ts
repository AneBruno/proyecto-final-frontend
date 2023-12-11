import { AuthService               } from 'src/app/auth/shared/services/auth.service';
import { Component                 } from '@angular/core';
import { EventEmitter              } from '@angular/core';
import { FileUploadButtonComponent } from 'src/app/shared/file-upload-button/file-upload-button.component';
import { FormBaseComponent         } from 'src/app/shared/form-base.component';
import { FormControl               } from '@angular/forms';
import { FormGroup                 } from '@angular/forms';
import { Input                     } from '@angular/core';
import { Observable                } from 'rxjs';
import { OnInit                    } from '@angular/core';
import { Output                    } from '@angular/core';
import { User                      } from 'src/app/shared/models/user.model';
import { UserService               } from 'src/app/auth/shared/services/user.service';
import { ViewChild                 } from '@angular/core';

@Component({
  selector    : 'usuarios-editar',
  templateUrl : './usuarios-editar.component.html',
  styleUrls   : ['./usuarios-editar.component.scss']
})
export class UsuariosEditarComponent extends FormBaseComponent implements OnInit {

    @ViewChild(FileUploadButtonComponent)
    public uploadComponent?: FileUploadButtonComponent;

    @Input()
    public user?: User;

    @Input()
    public id: any;

    @Input()
    public title: string = 'Editar usuario';

    @Input()
    public allowAvatarChange: boolean = true;

    @Input()
    public disabledFields: any = {};

    @Input()
    public mostrarBotonCancelar: boolean = true;

    @Input()
    public mostrarLogout: boolean = false;

    @Output()
    public clickSave: EventEmitter<FormGroup> = new EventEmitter<FormGroup>();

    @Output()
    public clickCancelar: EventEmitter<void> = new EventEmitter<void>();

    public roles$?: Observable<any[]>

    public avatarUri?: string;

    public urlImagen?: string;

    public actualizarDatos  : any;

    public rol_usuario : any;


    constructor(
        private authService : AuthService,
        private userService : UserService,
    ) {
        super();
    }

    ngOnInit(): void {
        this.roles$    = this.apiService.getData('/roles', {limit:0});

        this.form = this.fb.group({
            id                            : new FormControl({ value: ''    , disabled: this.disabledFields['id'                            ] }),
            nombre                        : new FormControl({ value: ''    , disabled: this.disabledFields['nombre'                        ] }),
            apellido                      : new FormControl({ value: ''    , disabled: this.disabledFields['apellido'                      ] }),
            telefono                      : new FormControl({ value: ''    , disabled: this.disabledFields['telefono'                      ] }),
            email                         : new FormControl({ value: ''    , disabled: this.disabledFields['email'                         ] }),
            rol_id                        : new FormControl({ value: ''    , disabled: this.disabledFields['rol_id'                        ] }),
            empresa_registro              : new FormControl({ value: ''    , disabled: this.disabledFields['empresa_registro'              ] })
            
        });

        if (this.id) {
            this.getUserById(this.id).subscribe(user => {
                this.rol_usuario = user.rol_id;
                this.setUser(user);
            });
        }

        if (this.user) {
            this.setUser(this.user);
        }

        this.userService.getUser$().subscribe(user => {
            this.urlImagen = user.urlImagen;
        })
    }

    protected get dataUrl(): string {
        return '/usuarios';
    }

    private getUserById(id: number): Observable<any> {
        return this.apiService.getData(this.getDataUrl(id));
    }

    public getFile(): File | null {
        if (!this.uploadComponent) {
            return null;
        }
        return this.uploadComponent?.choosenFile?? null;
    }

    public onSubmit() {
        let data = this.form?.getRawValue();
        this.clickSave.emit(data);
    }

    public setUser(user: User) {
        this.user = user;
        console.log("USER TRAE", user);
        this.form?.patchValue({
            id                            : user.id,
            nombre                        : user.nombre,
            apellido                      : user.apellido,
            telefono                      : user.telefono,
            email                         : user.email,
            rol_id                        : user.rol.id,
            empresa_registro              : user.empresa_registro
        });
    }

    public dataSaved() {
        this.uploadComponent?.reset();
    }

    public cancelar() {

    }

    public clickLogout() {
        this.authService.signOut();
    }

    public onClickCancelar() {
        this.clickCancelar.emit();
    }

}
