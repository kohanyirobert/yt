function refresh() {
    fetch('jobs', {
        credentials: 'same-origin'
    }).then((res) => {
        return res.json()
    }).then((data) => {
        this.jobs = data
    }).catch(console.error)
}

function download() {
    fetch('jobs', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url: this.url,
            out: this.out
        })
    }).then(console.log)
    .catch(console.error)
}

function cancel() {
    if (confirm('Cancel?')) {
        fetch(`jobs/${this.job.pid}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        }).then(console.log)
        .catch(console.error)
    }
}

Vue.component('job-item', {
    props: ['job'],
    template: `
        <li>
            <span v-bind:class="{ [job.status]: job.status }">{{ job.pid }} {{ job.status }} {{ job.progress }}%</span>
            <button v-on:click="cancel">Cancel</button>
        </li>
    `,
    methods: {
        cancel: cancel
    }
})

new Vue({
    el: '#app',
    data: {
        url: null,
        out: null,
        jobs: [],
        debugEnabled: false
    },
    created: function() {
        refresh.call(this)
        setInterval(refresh.bind(this), 1000)
    },
    methods: {
        download: function() {
            download.call(this)
            refresh.call(this)
        },
        toggleDebug: function() {
            this.debugEnabled = !this.debugEnabled
        }
    }
})
