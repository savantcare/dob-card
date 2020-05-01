<template>
  <div>
    <b-card
      :border-variant="style == 1 ? 'info' : 'dark'"
      :header="style == 1 ? 'info' : 'dark'"
      :header-bg-variant="style == 1 ? 'info' : 'dark'"
      header-text-variant="white"
    >
      <template v-slot:header>
        <b-row align-h="between" :style="{height: style == 1 ? '50px' : '30px'}">
          <h5 v-if="style == 1" class="m-md-2">DOB Card</h5>
          <span style="font-weight: bold;" v-if="style == 2">DOB Card</span>
          <b-row class="mr-2">
            <b-button variant="primary" v-if="selected.length == 0 && items.length == 0" @click="showAddModal">Add</b-button>
            <b-button variant="danger" v-if="selected.length > 0" @click="multiDelete">Delete</b-button>

            <b-dropdown v-model="style" :text="`Style ${style}`" right class="ml-2">
              <b-dropdown-item @click="style=1" :active="style == 1">Style1</b-dropdown-item>
              <b-dropdown-divider></b-dropdown-divider>
              <b-dropdown-item @click="style=2" :active="style == 2">Style2</b-dropdown-item>
            </b-dropdown>
          </b-row>
        </b-row>
      </template>
      <b-card-text>
        <b-table
          ref="selectableTable"
          selectable
          bordered
          select-mode="multi"
          :items="items"
          @row-selected="onRowSelected"
          responsive="sm"
          :fields="fields"
          :small="style == 2"
        >
          <!-- Example scoped slot for select state illustrative purposes -->
          <template v-slot:cell(action)="item">
            <b-button
              :size="style == 1 ? '' :'sm'"
              variant="outline-primary"
              @click="openEditModal(item)"
            >Edit</b-button>
            <b-button
              variant="outline-danger"
              @click="deleteDob(item)"
              class="ml-2"
              :size="style == 1 ? '' : 'sm'"
            >Delete</b-button>
          </template>
        </b-table>
      </b-card-text>
    </b-card>

    <b-modal v-model="modalShow" id="modal-center" centered :title="modalTitle">
      <b-form @submit.stop.prevent>
        <label>Date of birth:</label>
        <b-form-datepicker id="example-datepicker" v-model="data.dateOfBirth" :state="validation" class="mb-2"></b-form-datepicker>
        <b-form-invalid-feedback :state="validation">Date of birth is required.</b-form-invalid-feedback>
      </b-form>

      <template v-slot:modal-footer>
        <div class="float-right">
          <b-button size="sm" @click="modalShow=false">Close</b-button>
          <b-button
            class="ml-2"
            variant="primary"
            size="sm"
            @click="save"
            :disabled="!validation"
          >{{modalType == 1 ? "Save" : "Update"}}</b-button>
        </div>
      </template>
    </b-modal>
  </div>
</template>

<script>
import uniqid from "uniqid";
import store from "./store/index";
import axios from "axios";
const API_URL = "http://localhost:3000/dob";
export default {
  name: "DobCard",
  data() {
    return {
      fields: ["dateOfBirth", "createdAt", "action"],
      modalShow: false,
      data: {
        dateOfBirth: ""
      },
      selected: [],
      modalType: 1, // 1: add, 2: edit
      style: 1
    };
  },
  computed: {
    validation() {
      return this.data.dateOfBirth.length > 0;
    },
    modalTitle() {
      return this.modalType == 1 ? "Add DOB" : "Edit DOB";
    },
    items() {
      return store.state.dob;
    }
  },
  mounted() {
    this.onEventListener();
    this.getDobFromServer();
  },
  methods: {
    onRowSelected(items) {
      this.selected = items;
    },
    showAddModal() {
      this.modalShow = true;
      this.modalType = 1;
      this.data = { dateOfBirth: "" };
    },
    async save() {
      let currentDate = new Date();
      let birthDate = new Date(this.data.dateOfBirth);
      let difference = currentDate - birthDate;
      let age = Math.floor(difference/31557600000);

      if (this.modalType == 1) {
        const today = new Date();
        this.data["createdAt"] = today.toDateString();
        this.data["id"] = uniqid();
        this.data["dateOfBirth"] =  this.data["dateOfBirth"] + ' ('+age+' years)';
       
        store.commit("addDob", this.data);
        localStorage.setItem("event_dob_card", JSON.stringify(this.items));
        await axios.post(API_URL, this.data);
      } else {
        let newList = [];
        this.items.forEach(item => {
          if (item.id == this.data.id) {
            newList.push({
              id: this.data.id,
              dateOfBirth: this.data.dateOfBirth + ' ('+age+' years)',
              createdAt: this.data.createdAt
            });
          } else {
            newList.push(item);
          }
        });

        this.data.dateOfBirth = this.data.dateOfBirth + ' ('+age+' years)';
        store.commit("setDobList", newList);
        localStorage.setItem("event_dob_card", JSON.stringify(newList));
        await axios.put(`${API_URL}/${this.data.id}`, this.data);
      }
      this.modalShow = false;
    },
    openEditModal(item) {
      this.data = {
        id: this.items[item.index]["id"],
        dateOfBirth: this.items[item.index]["dateOfBirth"],
        createdAt: this.items[item.index]["createdAt"]
      };
      this.modalShow = true;
      this.modalType = 2;
    },
    async deleteDob(item) {
      let newList = [];
      this.items.forEach((data, index) => {
        if (index != item.index) {
          newList.push(data);
        }
      });

      const data = this.items[item.index];
      await axios.delete(`${API_URL}/${data.id}`);

      store.commit("setDobList", newList);
      localStorage.setItem("event_dob_card", JSON.stringify(newList));
    },
    multiDelete() {
      let newList = [];
      let index = 0;
      this.items.forEach(async item => {
        let isDeleted = false;
        this.selected.forEach(selectedItem => {
          if (item.id == selectedItem.id) {
            isDeleted = true;
          }
        });

        if (isDeleted) {
          await axios.delete(`${API_URL}/${item.id}`);
        } else {
          newList.push(item);
        }

        if (++index == this.items.length) {
          store.commit("setDobList", newList);
          localStorage.setItem("event_dob_card", JSON.stringify(newList));
        }
      });
    },
    onEventListener() {
      setInterval(function() {
        const event_dob_panel = localStorage.getItem(
          "event_dob_panel"
        );
        if (event_dob_panel != null) {
          const newList = JSON.parse(event_dob_panel);
          store.commit("setDobList", newList);
          localStorage.removeItem("event_dob_panel");
        }
      }, 100);
    },
    async getDobFromServer() {
      const { data } = await axios.get(API_URL);
      store.commit("setDobList", data);
    }
  }
};
</script>

<style>
</style>
