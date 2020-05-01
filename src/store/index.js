import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from "vuex-persistedstate";


Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    dob: []
  },
  mutations: {
    addDob(state, newData) {
      state.dob.push(newData)
    },
    setDobList(state, data) {
      state.dob = data
    }
  },
  actions: {
  },
  modules: {
  },
  plugins: [createPersistedState()]
})
